const db = require('../models');
const eloService = require('../services/eloService');
const statsService = require('../services/statsService');

function getWinner(factionResults) {
  if (!factionResults || factionResults.length === 0) return false;
  const maxScore = Math.max(...factionResults.map(f => f.ResultScore));
  if (maxScore === 0) return false;
  const winners = factionResults.filter(f => f.ResultScore === maxScore).map(f => f.ResultFactionKey);
  return winners.length === 1 ? winners[0] : false;
}

function getAllPlayersResults(jsonData, winningFactionKey) {
  const entityToFactionMap = new Map();
  if (jsonData.Factions) {
    jsonData.Factions.forEach(faction => {
      faction.Groups.forEach(group => {
        group.Playables.forEach(playable => {
          entityToFactionMap.set(playable.EntityId, faction.Key);
        });
      });
    });
  }
  const playerToEntityMap = new Map();
  if (jsonData.PlayersToPlayables) {
    jsonData.PlayersToPlayables.forEach(mapping => {
      playerToEntityMap.set(mapping.PlayerId, mapping.EntityId);
    });
  }
  let results = [];
  if (jsonData.Players) {
    results = jsonData.Players.map(player => {
      const entityId = playerToEntityMap.get(player.PlayerId);
      const faction = entityId ? entityToFactionMap.get(entityId) : "unknown";
      let result;
      if (!winningFactionKey) {
        result = "draw";
      } else {
        result = faction === winningFactionKey ? "win" : "lose";
      }
      return {
        playerIdentity: player.GUID,
        result,
      };
    });
  }
  if (jsonData.KillLog) {
    for (const log of jsonData.KillLog) {
      if (log.killerIdentity && !results.find(r => r.playerIdentity === log.killerIdentity)) {
        results.push({ playerIdentity: log.killerIdentity, result: "draw" });
      }
      if (log.victimIdentity && !results.find(r => r.playerIdentity === log.victimIdentity)) {
        results.push({ playerIdentity: log.victimIdentity, result: "draw" });
      }
    }
  }
  return results;
}

async function processMatchResults(req, res) {
  try {
    const winningFactionKey = getWinner(req.body.FactionResults);
    const sessionId = req.body.SessionId || String(Date.now());
    const timestamp = req.body.Timestamp ? new Date(req.body.Timestamp * 1000) : new Date();
    const playersResults = getAllPlayersResults(req.body, winningFactionKey);
    let unprocessedLogs = [];
    try {
      unprocessedLogs = await db.KillLog.findAll({ where: { processed: false } });
    } catch (err) {
      console.error('[MatchResultController] Ошибка при получении KillLog:', err);
    }
    const killStatsByPlayer = {};
    for (const log of unprocessedLogs) {
      if (log.killerIdentity && !log.suicide && !log.friendlyFire) {
        if (!killStatsByPlayer[log.killerIdentity]) killStatsByPlayer[log.killerIdentity] = { kills: 0, deaths: 0, teamkills: 0 };
        killStatsByPlayer[log.killerIdentity].kills++;
      }
      if (log.victimIdentity) {
        if (!killStatsByPlayer[log.victimIdentity]) killStatsByPlayer[log.victimIdentity] = { kills: 0, deaths: 0, teamkills: 0 };
        killStatsByPlayer[log.victimIdentity].deaths++;
      }
      if (log.friendlyFire && log.killerIdentity) {
        if (!killStatsByPlayer[log.killerIdentity]) killStatsByPlayer[log.killerIdentity] = { kills: 0, deaths: 0, teamkills: 0 };
        killStatsByPlayer[log.killerIdentity].teamkills++;
      }
    }
    if (playersResults && Array.isArray(playersResults)) {
      for (const player of playersResults) {
        const stats = killStatsByPlayer[player.playerIdentity] || { kills: 0, deaths: 0, teamkills: 0 };
        player.kills = stats.kills;
        player.deaths = stats.deaths;
        player.teamkills = stats.teamkills;
      }
    }
    if (playersResults && Array.isArray(playersResults)) {
      for (const player of playersResults) {
        try {
          await db.PlayerResult.create({
            playerIdentity: player.playerIdentity,
            result: player.result,
            sessionId,
            timestamp,
          });
        } catch (err) {
          console.error('[MatchResultController] Ошибка при создании PlayerResult:', err, player);
        }
      }
      const armaIds = playersResults.map(p => p.playerIdentity);
      let users = [];
      try {
        users = await db.User.findAll({ where: { armaId: armaIds } });
      } catch (err) {
        console.error('[MatchResultController] Ошибка при получении пользователей:', err);
      }
      const now = new Date();
      let currentSeason = null;
      try {
        currentSeason = await db.Season.findOne({
          where: {
            startDate: { [db.Sequelize.Op.lte]: now },
            endDate: { [db.Sequelize.Op.gte]: now }
          },
          order: [['startDate', 'DESC']]
        });
      } catch (err) {
        console.error('[MatchResultController] Ошибка при получении сезона:', err);
      }
      const seasonId = currentSeason ? currentSeason.id : null;
      if (seasonId) {
        for (const player of playersResults) {
          try {
            const user = users.find(u => u.armaId === player.playerIdentity);
            const [stats] = await db.PlayerSeasonStats.findOrCreate({
              where: { armaId: player.playerIdentity, seasonId },
              defaults: {
                userId: user ? user.id : null,
                armaId: player.playerIdentity,
                seasonId,
                kills: 0,
                deaths: 0,
                matches: 0,
                wins: 0,
                losses: 0
              }
            });
            await stats.increment('matches');
            if (player.result === 'win') await stats.increment('wins');
            if (player.result === 'lose') await stats.increment('losses');
            await stats.update({ lastUpdated: new Date() });
          } catch (err) {
            console.error('[MatchResultController] Ошибка при обновлении PlayerSeasonStats:', err, player);
          }
        }
        const squadMap = {};
        for (const user of users) {
          if (user.squadId) {
            if (!squadMap[user.squadId]) squadMap[user.squadId] = [];
            squadMap[user.squadId].push(user.armaId);
          }
        }
        for (const squadId of Object.keys(squadMap)) {
          try {
            const squadPlayers = squadMap[squadId];
            const isWin = squadPlayers.some(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'win');
            const [squadStats] = await db.SquadSeasonStats.findOrCreate({
              where: { squadId, seasonId },
              defaults: { squadId, seasonId, kills: 0, deaths: 0, matches: 0, wins: 0, losses: 0 }
            });
            await squadStats.increment('matches');
            if (isWin) await squadStats.increment('wins');
            else await squadStats.increment('losses');
            await squadStats.update({ lastUpdated: new Date() });
          } catch (err) {
            console.error('[MatchResultController] Ошибка при обновлении SquadSeasonStats:', err, squadId);
          }
        }
      }
      const results = playersResults.map(p => p.result);
      const allWin = results.length > 0 && results.every(r => r === 'win');
      const allLose = results.length > 0 && results.every(r => r === 'lose');
      if (allWin || allLose) {
        for (const player of playersResults) {
          player.result = 'draw';
        }
      }
      const winners = armaIds.filter(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'win');
      const losers = armaIds.filter(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'lose');
      const draws = armaIds.filter(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'draw');
      let playerStats = [];
      try {
        playerStats = await db.PlayerSeasonStats.findAll({ where: { seasonId, armaId: armaIds } });
      } catch (err) {
        console.error('[MatchResultController] Ошибка при получении PlayerSeasonStats:', err);
      }
      for (const armaId of armaIds) {
        let stats = playerStats.find(s => s.armaId === armaId);
        if (!stats) {
          try {
            const user = users.find(u => u.armaId === armaId);
            stats = await db.PlayerSeasonStats.create({ userId: user ? user.id : null, armaId, seasonId, kills: 0, deaths: 0 });
            playerStats.push(stats);
          } catch (err) {
            console.error('[MatchResultController] Ошибка при создании PlayerSeasonStats:', err, armaId);
          }
        }
      }
      for (const log of unprocessedLogs) {
        if (log.victimIdentity && !playerStats.find(s => s.armaId === log.victimIdentity)) {
          try {
            let stats = await db.PlayerSeasonStats.create({ userId: null, armaId: log.victimIdentity, seasonId, kills: 0, deaths: 0 });
            playerStats.push(stats);
          } catch (err) {
            console.error('[MatchResultController] Ошибка при создании PlayerSeasonStats для жертвы из KillLog:', err, log);
          }
        }
      }
      const K = 64;
      for (const armaId of armaIds) {
        try {
          const stats = playerStats.find(s => s.armaId === armaId);
          if (!stats) continue;
          const playerResult = playersResults.find(p => p.playerIdentity === armaId);
          if (!playerResult) continue;
          let isWin = playerResult.result === 'win';
          let isLose = playerResult.result === 'lose';
          let isDraw = playerResult.result === 'draw';
          const kills = playerResult.kills || 0;
          const deaths = playerResult.deaths || 0;
          const teamkills = playerResult.teamkills || 0;
          let score = isWin ? 1 : isLose ? 0 : 0.5;
          let opponents;
          if (isWin) opponents = losers;
          else if (isLose) opponents = winners;
          else opponents = armaIds.filter(aid => aid !== armaId);
          if (!opponents.length) continue;
          const avgOpponentElo = opponents.reduce((sum, aid) => {
            const s = playerStats.find(ps => ps.armaId === aid);
            return sum + (s ? s.elo : 1000);
          }, 0) / opponents.length;
          score += (kills * 0.1) - (deaths * 0.02) - (teamkills * 0.1);
          score = Math.max(0, Math.min(1, score));
          const expected = 1 / (1 + Math.pow(10, ((avgOpponentElo - stats.elo) / 400)));
          const newElo = eloService.calculateElo(stats.elo, score, expected, K);
          await stats.update({ elo: newElo, lastUpdated: new Date() });
          if (stats.userId) {
            const userStats = await db.UserStats.findOne({ where: { userId: stats.userId } });
            if (userStats && (userStats.maxElo === null || newElo > userStats.maxElo)) {
              await userStats.update({ maxElo: newElo });
            }
          }
        } catch (err) {
          console.error('[MatchResultController] Ошибка при расчёте/обновлении эло игрока:', err, armaId);
        }
      }
      // Для отрядов аналогично (можно вынести в отдельную функцию при необходимости)
      // ...
    }
    if (unprocessedLogs.length) {
      try {
        await db.KillLog.update({ processed: true }, { where: { id: unprocessedLogs.map(l => l.id) } });
      } catch (err) {
        console.error('[MatchResultController] Ошибка при пометке KillLog как processed:', err);
      }
    }
    res.status(200).json({ message: 'Данные получены и обработаны' });
  } catch (err) {
    console.error('[MatchResultController] Критическая ошибка в processMatchResults:', err);
    res.status(500).json({ error: 'Ошибка при обработке событий' });
  }
}

module.exports = { processMatchResults }; 