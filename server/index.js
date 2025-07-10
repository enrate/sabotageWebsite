require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');
const { protect, admin } = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const issueSeasonAwards = require('./cron/issueSeasonAwards');
const db = require('./models');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');
const path = require('path');
dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Подключение к PostgreSQL
sequelize.authenticate()
.then(() => {
  console.log('PostgreSQL connected');
  return sequelize.sync({ alter: true }); // Синхронизация моделей с базой данных
})
.then(() => {
  console.log('Database synchronized');
})
.catch(err => {
  console.error('Database connection error:', err);
});

function getWinner(factionResults) {
  if (!factionResults || factionResults.length === 0) return false;
  const maxScore = Math.max(...factionResults.map(f => f.ResultScore));
  if (maxScore === 0) return false;
  const winners = factionResults.filter(f => f.ResultScore === maxScore).map(f => f.ResultFactionKey);
  return winners.length === 1 ? winners[0] : false;
}

function getAllPlayersResults(jsonData, winningFactionKey) {
  if (!winningFactionKey) return false;
  const entityToFactionMap = new Map();
  jsonData.Factions.forEach(faction => {
    faction.Groups.forEach(group => {
      group.Playables.forEach(playable => {
        entityToFactionMap.set(playable.EntityId, faction.Key);
      });
    });
  });
  const playerToEntityMap = new Map();
  jsonData.PlayersToPlayables.forEach(mapping => {
    playerToEntityMap.set(mapping.PlayerId, mapping.EntityId);
  });
  return jsonData.Players.map(player => {
    const entityId = playerToEntityMap.get(player.PlayerId);
    const faction = entityId ? entityToFactionMap.get(entityId) : "unknown";
    const result = faction === winningFactionKey ? "win" : "lose";
    return {
      playerIdentity: player.GUID,
      result,
    };
  });
}

// Простой POST /api/server/data с проверкой Bearer токена
app.post('/api/server/data', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== process.env.EVENTS_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { events } = req.body;
    if (Array.isArray(events)) {
      for (const event of events) {
        console.log(event)
        if (event.name === 'logger_player_killed') {
          const killLog = await db.KillLog.create({
            friendlyFire: event.data.isFriendly, // исправлено
            suicide: event.data.isSuicide,       // исправлено
            killerIdentity: event.data.killerIdentity || null,
            victimIdentity: event.data.victimIdentity || null,
            timestamp: event.data.timestamp ? new Date(event.data.timestamp * 1000) : new Date(),
          });
          console.log(killLog);

          // --- Определяем текущий сезон ---
          const now = new Date();
          const currentSeason = await db.Season.findOne({
            where: {
              startDate: { [db.Sequelize.Op.lte]: now },
              endDate: { [db.Sequelize.Op.gte]: now }
            },
            order: [['startDate', 'DESC']]
          });
          const seasonId = currentSeason ? currentSeason.id : null;

          const { killerIdentity, victimIdentity } = event.data;
          const isSuicide = event.data.suicide;
          const isFriendlyFire = event.data.friendlyFire;

          // --- Тимкилл ---
          if (isFriendlyFire && killerIdentity) {
            const killerUser = await db.User.findOne({ where: { armaId: killerIdentity } });
            if (killerUser) {
              // Общая статистика
              const [stats] = await db.UserStats.findOrCreate({
                where: { armaId: killerIdentity },
                defaults: { userId: killerUser.id, armaId: killerIdentity, kills: 0, deaths: 0, teamkills: 0 }
              });
              await stats.increment('teamkills');
              await stats.update({ lastUpdated: new Date() });
              // squad_stats
              if (killerUser.squadId) {
                const [squadStats] = await db.SquadStats.findOrCreate({
                  where: { squadId: killerUser.squadId },
                  defaults: { squadId: killerUser.squadId, kills: 0, deaths: 0, teamkills: 0 }
                });
                await squadStats.increment('teamkills');
                await squadStats.update({ lastUpdated: new Date() });
              }
              // player_season_stats
              if (seasonId) {
                const [seasonStats] = await db.PlayerSeasonStats.findOrCreate({
                  where: { userId: killerUser.id, armaId: killerIdentity, seasonId },
                  defaults: { userId: killerUser.id, armaId: killerIdentity, seasonId, kills: 0, deaths: 0, teamkills: 0 }
                });
                await seasonStats.increment('teamkills');
                await seasonStats.update({ lastUpdated: new Date() });
                // squad_season_stats
                if (killerUser.squadId) {
                  const [squadSeasonStats] = await db.SquadSeasonStats.findOrCreate({
                    where: { squadId: killerUser.squadId, seasonId },
                    defaults: { squadId: killerUser.squadId, seasonId, kills: 0, deaths: 0, teamkills: 0 }
                  });
                  await squadSeasonStats.increment('teamkills');
                  await squadSeasonStats.update({ lastUpdated: new Date() });
                }
              }
            }
            // Жертве засчитываем только смерть
            if (victimIdentity) {
              const victimUser = await db.User.findOne({ where: { armaId: victimIdentity } });
              if (victimUser) {
                const [stats] = await db.UserStats.findOrCreate({
                  where: { armaId: victimIdentity },
                  defaults: { userId: victimUser.id, armaId: victimIdentity, kills: 0, deaths: 0, teamkills: 0 }
                });
                await stats.increment('deaths');
                await stats.update({ lastUpdated: new Date() });
                if (victimUser.squadId) {
                  const [squadStats] = await db.SquadStats.findOrCreate({
                    where: { squadId: victimUser.squadId },
                    defaults: { squadId: victimUser.squadId, kills: 0, deaths: 0, teamkills: 0 }
                  });
                  await squadStats.increment('deaths');
                  await squadStats.update({ lastUpdated: new Date() });
                }
                if (seasonId) {
                  const [seasonStats] = await db.PlayerSeasonStats.findOrCreate({
                    where: { userId: victimUser.id, armaId: victimIdentity, seasonId },
                    defaults: { userId: victimUser.id, armaId: victimIdentity, seasonId, kills: 0, deaths: 0, teamkills: 0 }
                  });
                  await seasonStats.increment('deaths');
                  await seasonStats.update({ lastUpdated: new Date() });
                  if (victimUser.squadId) {
                    const [squadSeasonStats] = await db.SquadSeasonStats.findOrCreate({
                      where: { squadId: victimUser.squadId, seasonId },
                      defaults: { squadId: victimUser.squadId, seasonId, kills: 0, deaths: 0, teamkills: 0 }
                    });
                    await squadSeasonStats.increment('deaths');
                    await squadSeasonStats.update({ lastUpdated: new Date() });
                  }
                }
              }
            }
            continue; // Не засчитываем убийство
          }

          // --- Суицид ---
          if (isSuicide && victimIdentity) {
            const victimUser = await db.User.findOne({ where: { armaId: victimIdentity } });
            if (victimUser) {
              const [stats] = await db.UserStats.findOrCreate({
                where: { armaId: victimIdentity },
                defaults: { userId: victimUser.id, armaId: victimIdentity, kills: 0, deaths: 0, teamkills: 0 }
              });
              await stats.increment('deaths');
              await stats.update({ lastUpdated: new Date() });
              if (victimUser.squadId) {
                const [squadStats] = await db.SquadStats.findOrCreate({
                  where: { squadId: victimUser.squadId },
                  defaults: { squadId: victimUser.squadId, kills: 0, deaths: 0, teamkills: 0 }
                });
                await squadStats.increment('deaths');
                await squadStats.update({ lastUpdated: new Date() });
              }
              if (seasonId) {
                const [seasonStats] = await db.PlayerSeasonStats.findOrCreate({
                  where: { userId: victimUser.id, armaId: victimIdentity, seasonId },
                  defaults: { userId: victimUser.id, armaId: victimIdentity, seasonId, kills: 0, deaths: 0, teamkills: 0 }
                });
                await seasonStats.increment('deaths');
                await seasonStats.update({ lastUpdated: new Date() });
                if (victimUser.squadId) {
                  const [squadSeasonStats] = await db.SquadSeasonStats.findOrCreate({
                    where: { squadId: victimUser.squadId, seasonId },
                    defaults: { squadId: victimUser.squadId, seasonId, kills: 0, deaths: 0, teamkills: 0 }
                  });
                  await squadSeasonStats.increment('deaths');
                  await squadSeasonStats.update({ lastUpdated: new Date() });
                }
              }
            }
            continue; // Не засчитываем убийство
          }

          // --- Обычное убийство ---
          // Обновить статистику убийцы
          if (killerIdentity) {
            const killerUser = await db.User.findOne({ where: { armaId: killerIdentity } });
            if (killerUser) {
              // --- Общая статистика ---
              const [stats, created] = await db.UserStats.findOrCreate({
                where: { armaId: killerIdentity },
                defaults: { userId: killerUser.id, armaId: killerIdentity, kills: 0, deaths: 0 }
              });
              await stats.increment('kills');
              await stats.update({ lastUpdated: new Date() });
              // --- squad_stats ---
              if (killerUser.squadId) {
                const [squadStats, squadCreated] = await db.SquadStats.findOrCreate({
                  where: { squadId: killerUser.squadId },
                  defaults: { squadId: killerUser.squadId, kills: 0, deaths: 0 }
                });
                await squadStats.increment('kills');
                await squadStats.update({ lastUpdated: new Date() });
              }
              // --- player_season_stats ---
              if (seasonId) {
                const [seasonStats, seasonCreated] = await db.PlayerSeasonStats.findOrCreate({
                  where: { userId: killerUser.id, armaId: killerIdentity, seasonId },
                  defaults: { userId: killerUser.id, armaId: killerIdentity, seasonId, kills: 0, deaths: 0 }
                });
                await seasonStats.increment('kills');
                await seasonStats.update({ lastUpdated: new Date() });
                // --- squad_season_stats ---
                if (killerUser.squadId) {
                  const [squadSeasonStats, squadSeasonCreated] = await db.SquadSeasonStats.findOrCreate({
                    where: { squadId: killerUser.squadId, seasonId },
                    defaults: { squadId: killerUser.squadId, seasonId, kills: 0, deaths: 0 }
                  });
                  await squadSeasonStats.increment('kills');
                  await squadSeasonStats.update({ lastUpdated: new Date() });
                }
              }
            }
          }
          // Обновить статистику жертвы
          if (victimIdentity) {
            const victimUser = await db.User.findOne({ where: { armaId: victimIdentity } });
            if (victimUser) {
              // --- Общая статистика ---
              const [stats, created] = await db.UserStats.findOrCreate({
                where: { armaId: victimIdentity },
                defaults: { userId: victimUser.id, armaId: victimIdentity, kills: 0, deaths: 0 }
              });
              await stats.increment('deaths');
              await stats.update({ lastUpdated: new Date() });
              // --- squad_stats ---
              if (victimUser.squadId) {
                const [squadStats, squadCreated] = await db.SquadStats.findOrCreate({
                  where: { squadId: victimUser.squadId },
                  defaults: { squadId: victimUser.squadId, kills: 0, deaths: 0 }
                });
                await squadStats.increment('deaths');
                await squadStats.update({ lastUpdated: new Date() });
              }
              // --- player_season_stats ---
              if (seasonId) {
                const [seasonStats, seasonCreated] = await db.PlayerSeasonStats.findOrCreate({
                  where: { userId: victimUser.id, armaId: victimIdentity, seasonId },
                  defaults: { userId: victimUser.id, armaId: victimIdentity, seasonId, kills: 0, deaths: 0 }
                });
                await seasonStats.increment('deaths');
                await seasonStats.update({ lastUpdated: new Date() });
                // --- squad_season_stats ---
                if (victimUser.squadId) {
                  const [squadSeasonStats, squadSeasonCreated] = await db.SquadSeasonStats.findOrCreate({
                    where: { squadId: victimUser.squadId, seasonId },
                    defaults: { squadId: victimUser.squadId, seasonId, kills: 0, deaths: 0 }
                  });
                  await squadSeasonStats.increment('deaths');
                  await squadSeasonStats.update({ lastUpdated: new Date() });
                }
              }
            }
          }
        }
      }
    } else if (req.body.Factions) {

      // Обработка результатов игроков
      const winningFactionKey = getWinner(req.body.FactionResults);
      const sessionId = req.body.SessionId || String(Date.now());
      const timestamp = req.body.Timestamp ? new Date(req.body.Timestamp * 1000) : new Date();
      const playersResults = getAllPlayersResults(req.body, winningFactionKey);
      // --- Новый блок: агрегируем kills/deaths/teamkills из KillLog с processed=false ---
      const unprocessedLogs = await db.KillLog.findAll({ where: { processed: false } });
      // Группируем по игроку
      const killStatsByPlayer = {};
      for (const log of unprocessedLogs) {
        // Убийца
        if (log.killerIdentity && !log.suicide && !log.friendlyFire) {
          if (!killStatsByPlayer[log.killerIdentity]) killStatsByPlayer[log.killerIdentity] = { kills: 0, deaths: 0, teamkills: 0 };
          killStatsByPlayer[log.killerIdentity].kills++;
        }
        // Смерть (жертва)
        if (log.victimIdentity) {
          if (!killStatsByPlayer[log.victimIdentity]) killStatsByPlayer[log.victimIdentity] = { kills: 0, deaths: 0, teamkills: 0 };
          killStatsByPlayer[log.victimIdentity].deaths++;
        }
        // Тимкилл
        if (log.friendlyFire && log.killerIdentity) {
          if (!killStatsByPlayer[log.killerIdentity]) killStatsByPlayer[log.killerIdentity] = { kills: 0, deaths: 0, teamkills: 0 };
          killStatsByPlayer[log.killerIdentity].teamkills++;
        }
      }
      // --- Вставляем статистику в playerResults ---
      if (playersResults && Array.isArray(playersResults)) {
        for (const player of playersResults) {
          const stats = killStatsByPlayer[player.playerIdentity] || { kills: 0, deaths: 0, teamkills: 0 };
          player.kills = stats.kills;
          player.deaths = stats.deaths;
          player.teamkills = stats.teamkills;
        }
      }
      // --- После расчёта эло ---
      if (playersResults && Array.isArray(playersResults)) {
        for (const player of playersResults) {
          await db.PlayerResult.create({
            playerIdentity: player.playerIdentity,
            result: player.result,
            sessionId,
            timestamp,
          });
        }
        // --- Получаем пользователей и сезон ДО обновления статистики ---
        const armaIds = playersResults.map(p => p.playerIdentity);
        const users = await db.User.findAll({ where: { armaId: armaIds } });
        const now = new Date();
        const currentSeason = await db.Season.findOne({
          where: {
            startDate: { [db.Sequelize.Op.lte]: now },
            endDate: { [db.Sequelize.Op.gte]: now }
          },
          order: [['startDate', 'DESC']]
        });
        const seasonId = currentSeason ? currentSeason.id : null;
        // --- Обновление win/loss/matches для игроков и отрядов ---
        if (seasonId) {
          // Игроки
          for (const player of playersResults) {
            const user = users.find(u => u.armaId === player.playerIdentity);
            if (!user) continue;
            const [stats] = await db.PlayerSeasonStats.findOrCreate({
              where: { userId: user.id, armaId: player.playerIdentity, seasonId },
              defaults: { userId: user.id, armaId: player.playerIdentity, seasonId, kills: 0, deaths: 0, matches: 0, wins: 0, losses: 0 }
            });
            await stats.increment('matches');
            if (player.result === 'win') await stats.increment('wins');
            if (player.result === 'lose') await stats.increment('losses');
            await stats.update({ lastUpdated: new Date() });
          }
          // Отряды
          // Группируем пользователей по squadId
          const squadMap = {};
          for (const user of users) {
            if (user.squadId) {
              if (!squadMap[user.squadId]) squadMap[user.squadId] = [];
              squadMap[user.squadId].push(user.armaId);
            }
          }
          for (const squadId of Object.keys(squadMap)) {
            const squadPlayers = squadMap[squadId];
            // Если хотя бы один игрок отряда победил — победа всему отряду
            const isWin = squadPlayers.some(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'win');
            const [squadStats] = await db.SquadSeasonStats.findOrCreate({
              where: { squadId, seasonId },
              defaults: { squadId, seasonId, kills: 0, deaths: 0, matches: 0, wins: 0, losses: 0 }
            });
            await squadStats.increment('matches');
            if (isWin) await squadStats.increment('wins');
            else await squadStats.increment('losses');
            await squadStats.update({ lastUpdated: new Date() });
          }
        }
        // --- Расчёт и обновление эло ---
        // 1. Получаем всех пользователей по armaId
        // (armaIds, users, seasonId уже объявлены выше)
        // 3. Группируем по результату
        const winners = armaIds.filter(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'win');
        const losers = armaIds.filter(aid => playersResults.find(p => p.playerIdentity === aid)?.result === 'lose');
        // 4. Получаем текущий эло игроков и отрядов
        const playerStats = await db.PlayerSeasonStats.findAll({ where: { seasonId, armaId: armaIds } });
        // --- создаём записи, если их нет ---
        for (const armaId of armaIds) {
          let stats = playerStats.find(s => s.armaId === armaId);
          if (!stats) {
            const user = users.find(u => u.armaId === armaId);
            stats = await db.PlayerSeasonStats.create({ userId: user ? user.id : null, armaId, seasonId, kills: 0, deaths: 0 });
            playerStats.push(stats);
          }
        }
        const squadIds = users.map(u => u?.squadId).filter(Boolean);
        let squadStats = squadIds.length ? await db.SquadSeasonStats.findAll({ where: { seasonId, squadId: squadIds } }) : [];
        // --- создаём записи для отрядов, если их нет ---
        for (const squadId of squadIds) {
          let squad = squadStats.find(sq => sq.squadId === squadId);
          if (!squad) {
            squad = await db.SquadSeasonStats.create({ squadId, seasonId, kills: 0, deaths: 0 });
            squadStats.push(squad);
          }
        }
        // 5. Классическая формула эло
        const K = 32;
        // Для игроков
        for (const armaId of armaIds) {
          const stats = playerStats.find(s => s.armaId === armaId);
          if (!stats) continue;
          const playerResult = playersResults.find(p => p.playerIdentity === armaId);
          if (!playerResult || (playerResult.result !== 'win' && playerResult.result !== 'lose')) continue;
          const isWin = playerResult.result === 'win';
          // Получаем статистику за матч (kills, deaths, teamkills)
          // Для этого нужно, чтобы playersResults содержал эти данные, либо получить их из KillLog за матч
          // Здесь предполагаем, что playerResult содержит kills, deaths, teamkills за матч
          const kills = playerResult.kills || 0;
          const deaths = playerResult.deaths || 0;
          const teamkills = playerResult.teamkills || 0;
          // Новый score с учётом всех параметров
          let score = (isWin ? 1 : 0) + (kills * 0.04) - (deaths * 0.02) - (teamkills * 0.1);
          score = Math.max(0, Math.min(1, score));
          // Среднее эло соперников
          const opponents = isWin ? losers : winners;
          if (!opponents.length) continue;
          const avgOpponentElo = opponents.reduce((sum, aid) => {
            const s = playerStats.find(ps => ps.armaId === aid);
            return sum + (s ? s.elo : 1000);
          }, 0) / opponents.length;
          const expected = 1 / (1 + Math.pow(10, ((avgOpponentElo - stats.elo) / 400)));
          const newElo = Math.round(stats.elo + K * (score - expected));
          console.log('Обновляю эло игрока:', armaId, 'userId:', stats.userId, 'старое:', stats.elo, 'новое:', newElo, 'score:', score);
          await stats.update({ elo: newElo, lastUpdated: new Date() });
          // --- Обновление maxElo в user_stats ---
          if (stats.userId) {
            const userStats = await db.UserStats.findOne({ where: { userId: stats.userId } });
            if (userStats && (userStats.maxElo === null || newElo > userStats.maxElo)) {
              await userStats.update({ maxElo: newElo });
            }
          }
        }
        // Для отрядов
        for (const squadId of [...new Set(squadIds)]) {
          const squad = squadStats.find(sq => sq.squadId === squadId);
          if (!squad) continue;
          const squadUsers = users.filter(u => u.squadId === squadId);
          // Для отряда score — среднее по всем участникам
          let squadScores = [];
          for (const user of squadUsers) {
            const playerResult = playersResults.find(p => p.playerIdentity === user.armaId);
            if (!playerResult || (playerResult.result !== 'win' && playerResult.result !== 'lose')) continue;
            const isWin = playerResult.result === 'win';
            const kills = playerResult.kills || 0;
            const deaths = playerResult.deaths || 0;
            const teamkills = playerResult.teamkills || 0;
            let score = (isWin ? 1 : 0) + (kills * 0.04) - (deaths * 0.02) - (teamkills * 0.1);
            score = Math.max(0, Math.min(1, score));
            squadScores.push(score);
          }
          if (!squadScores.length) continue;
          const avgScore = squadScores.reduce((a, b) => a + b, 0) / squadScores.length;
          // Соперники — другие отряды
          const opponents = users.filter(u => u.squadId && u.squadId !== squadId);
          if (!opponents.length) continue;
          const opponentSquadStats = squadStats.filter(sq => sq.squadId !== squadId);
          const avgOpponentElo = opponentSquadStats.length ? (opponentSquadStats.reduce((sum, s) => sum + (s.elo || 1000), 0) / opponentSquadStats.length) : 1000;
          const expected = 1 / (1 + Math.pow(10, ((avgOpponentElo - squad.elo) / 400)));
          const newElo = Math.round(squad.elo + K * (avgScore - expected));
          console.log('Обновляю эло отряда:', squadId, 'старое:', squad.elo, 'новое:', newElo, 'score:', avgScore);
          await squad.update({ elo: newElo, lastUpdated: new Date() });
        }
      }
      // --- Помечаем логи как обработанные ---
      if (unprocessedLogs.length) {
        await db.KillLog.update({ processed: true }, { where: { id: unprocessedLogs.map(l => l.id) } });
      }
    }
    res.status(200).json({ message: 'Данные получены и обработаны' });
  } catch (err) {
    console.error('Ошибка при обработке событий:', err);
    res.status(500).json({ error: 'Ошибка при обработке событий' });
  }
});

// Роуты
app.use('/api', routes);

// Production static
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// --- REST API ---
const REST_PORT = process.env.REST_PORT || 5000;
app.listen(REST_PORT, () => {
  console.log(`REST API running on port ${REST_PORT}`);
});

// --- SOCKET.IO ---
const { Server } = require('socket.io');
const io = new Server({
  cors: { origin: '*' },
});
const SOCKET_PORT = process.env.SOCKET_PORT || 5001;
io.listen(SOCKET_PORT);
console.log(`Socket.io running on port ${SOCKET_PORT}`);

io.on('connection', (socket) => {
  console.log('Socket connected');
});

cron.schedule('0 3 * * *', async () => {
await issueSeasonAwards();
});