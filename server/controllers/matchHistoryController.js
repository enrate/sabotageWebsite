const db = require('../models');

// Получить историю матчей (последние 20)
exports.getMatchHistory = async (req, res) => {
  try {
    // Получаем последние 20 матчей из MatchHistory
    const matches = await db.MatchHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    // Формируем ответ для фронта
    const result = matches.map(m => {
      const data = m.data || {};
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
      // --- Список игроков с фракциями ---
      const players = Array.isArray(data.Players) ? data.Players.map(p => {
        const entityId = playerIdToEntity[p.PlayerId];
        const faction = entityToFaction[entityId] || null;
        return { playerIdentity: p.GUID, name: p.Name, faction, entityId };
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
        players,
        kills,
        factionObjectives,
        raw: data // для отладки, можно убрать
      };
    });
    res.json(result);
  } catch (err) {
    console.error('[MatchHistory] Ошибка получения истории матчей:', err);
    res.status(500).json({ error: 'Ошибка получения истории матчей' });
  }
}; 