const db = require('../models');
const { Op } = require('sequelize');

// Получить историю матчей с пагинацией и userId для игроков
exports.getMatchHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const offset = parseInt(req.query.offset) || 0;

    // Фильтры
    const { startDate, endDate, missionNames, nicknames } = req.query;

    // Формируем where для sequelize
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Получаем все матчи с фильтрацией по дате
    const allMatches = await db.MatchHistory.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Фильтрация по сценарию и никнейму (по данным внутри data)
    let filteredMatches = allMatches;
    // Фильтр по имени сценария
    if (missionNames) {
      let namesArr = Array.isArray(missionNames) ? missionNames : [missionNames];
      filteredMatches = filteredMatches.filter(m => {
        const missionName = m.data?.MissionName || '';
        return namesArr.includes(missionName);
      });
    }
    // Фильтр по никнейму игрока
    if (nicknames) {
      let nicksArr = Array.isArray(nicknames) ? nicknames : [nicknames];
      filteredMatches = filteredMatches.filter(m => {
        const players = m.data?.Players || [];
        // Все никнеймы должны быть найдены среди игроков матча
        return nicksArr.every(nick => players.some(p => (p.Name || '').toLowerCase() === nick.toLowerCase()));
      });
    }
    // Фильтр по armaId (GUID)
    if (req.query.armaId) {
      const armaId = String(req.query.armaId).trim().toLowerCase();
      filteredMatches = filteredMatches.filter(m => {
        const players = m.data?.Players || [];
        return players.some(p => (p.GUID || '').trim().toLowerCase() === armaId);
      });
    }

    const totalCount = filteredMatches.length;
    const matches = filteredMatches.slice(offset, offset + limit);

    // Собираем все уникальные armaId из всех матчей
    let allArmaIds = new Set();
    const matchesData = matches.map(m => {
      const data = m.data || {};
      let playerIdToEntity = {};
      if (Array.isArray(data.PlayersToPlayables)) {
        data.PlayersToPlayables.forEach(mapping => {
          playerIdToEntity[mapping.PlayerId] = mapping.EntityId;
        });
      }
      const players = Array.isArray(data.Players) ? data.Players.map(p => {
        const entityId = playerIdToEntity[p.PlayerId];
        const armaId = p.GUID ? String(p.GUID).trim().toLowerCase() : null;
        if (armaId) allArmaIds.add(armaId);
        return { playerIdentity: p.GUID, name: p.Name, entityId };
      }) : [];
      return { m, data, players };
    });
    allArmaIds = Array.from(allArmaIds);

    // Получаем всех пользователей с этими armaId
    let users = [];
    if (allArmaIds.length > 0) {
      users = await db.User.findAll({
        where: {
          armaId: {
            [Op.in]: allArmaIds
          }
        },
        attributes: ['id', 'armaId']
      });
    }
    const armaIdToUserId = {};
    users.forEach(u => {
      if (u.armaId) armaIdToUserId[String(u.armaId).trim().toLowerCase()] = u.id;
    });

    // Получаем все PlayerResult для этих матчей (по sessionId)
    const sessionIds = matches.map(m => m.sessionId);
    let allPlayerResults = [];
    if (sessionIds.length > 0) {
      allPlayerResults = await db.PlayerResult.findAll({
        where: { sessionId: sessionIds },
        attributes: ['sessionId', 'playerIdentity', 'eloChange']
      });
    }
    // Получаем все PlayerSeasonStats для этих игроков и сезона (берём последнее эло)
    let allPlayerStats = [];
    if (allArmaIds.length > 0) {
      allPlayerStats = await db.PlayerSeasonStats.findAll({
        where: { armaId: allArmaIds },
        attributes: ['armaId', 'elo', 'seasonId']
      });
    }
    const eloChangeMap = {};
    for (const pr of allPlayerResults) {
      eloChangeMap[`${pr.sessionId}_${pr.playerIdentity}`] = pr.eloChange;
    }
    const eloAfterMap = {};
    for (const stat of allPlayerStats) {
      eloAfterMap[stat.armaId] = stat.elo;
    }
    // Формируем ответ для фронта
    const result = matchesData.map(({ m, data, players }) => {
      // --- Сопоставления для фракций ---
      let entityToFaction = {};
      if (Array.isArray(data.Factions)) {
        data.Factions.forEach(faction => {
          if (Array.isArray(faction.Groups)) {
            faction.Groups.forEach(group => {
              if (Array.isArray(group.Playables)) {
                group.Playables.forEach(playable => {
                  entityToFaction[playable.EntityId] = faction.Key;
                });
              }
            });
          }
        });
      }
      let playerIdToEntity = {};
      if (Array.isArray(data.PlayersToPlayables)) {
        data.PlayersToPlayables.forEach(mapping => {
          playerIdToEntity[mapping.PlayerId] = mapping.EntityId;
        });
      }
      // --- Список игроков с фракциями и userId ---
      const playersWithUserId = Array.isArray(data.Players) ? data.Players.map(p => {
        const entityId = playerIdToEntity[p.PlayerId];
        const faction = entityToFaction[entityId] || null;
        const armaId = p.GUID ? String(p.GUID).trim().toLowerCase() : null;
        const userId = armaId ? armaIdToUserId[armaId] || null : null;
        const eloChange = eloChangeMap[`${m.sessionId}_${p.GUID}`] ?? null;
        const eloAfter = armaId ? eloAfterMap[armaId] ?? null : null;
        return { playerIdentity: p.GUID, name: p.Name, faction, entityId, userId, PlayerId: p.PlayerId, eloChange, eloAfter };
      }) : [];
      // --- Определение тимкиллов ---
      const kills = Array.isArray(data.Kills) ? data.Kills.map(k => {
        const killerEntity = playerIdToEntity[k.InstigatorId];
        const victimEntity = playerIdToEntity[k.PlayerId];
        const killerFaction = entityToFaction[killerEntity];
        const victimFaction = entityToFaction[victimEntity];
        const isSuicide = k.InstigatorId === k.PlayerId;
        const isTeamkill = !isSuicide && killerFaction && victimFaction && killerFaction === victimFaction;
        return {
          killerId: k.InstigatorId,
          victimId: k.PlayerId,
          killerFaction,
          victimFaction,
          time: k.Time,
          systemTime: k.SystemTime,
          isSuicide,
          isTeamkill
        };
      }) : [];
      // --- Задачи фракций и их статусы ---
      let factionObjectives = [];
      if (Array.isArray(data.FactionResults)) {
        factionObjectives = data.FactionResults.map(fr => ({
          factionKey: fr.ResultFactionKey,
          resultName: fr.ResultName,
          resultScore: fr.ResultScore,
          objectives: Array.isArray(fr.Objectives) ? fr.Objectives.map(obj => ({
            name: obj.Name,
            completed: obj.Completed,
            score: obj.Score
          })) : []
        }));
      }
      return {
        sessionId: m.sessionId,
        date: data.Timestamp ? new Date(data.Timestamp * 1000) : m.createdAt,
        missionName: data.MissionName || null,
        players: playersWithUserId,
        kills,
        factionObjectives,
        raw: data // для отладки, можно убрать
      };
    });
    res.json({ matches: result, totalCount });
  } catch (err) {
    console.error('[MatchHistory] Ошибка получения истории матчей:', err);
    res.status(500).json({ error: 'Ошибка получения истории матчей' });
  }
}; 