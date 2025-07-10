const db = require('../models');
const statsService = require('../services/statsService');

async function processKillEvent(event, seasonId) {
  try {
    const { isFriendly, isSuicide, killerIdentity, victimIdentity, timestamp } = event.data;
    // Запись в KillLog
    let killLog;
    try {
      killLog = await db.KillLog.create({
        friendlyFire: !!isFriendly,
        suicide: !!isSuicide,
        killerIdentity: killerIdentity || null,
        victimIdentity: victimIdentity || null,
        timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
      });
    } catch (err) {
      console.error('[KillLogController] Ошибка при создании KillLog:', err, event);
      throw err;
    }
    // --- Тимкилл ---
    if (isFriendly && killerIdentity) {
      try {
        const killerUser = await db.User.findOne({ where: { armaId: killerIdentity } });
        await statsService.incrementUserStats(killerIdentity, 'teamkills');
        if (killerUser && killerUser.squadId) {
          await statsService.incrementSquadStats(killerUser.squadId, 'teamkills');
        }
        if (seasonId) {
          await statsService.incrementPlayerSeasonStats(killerIdentity, seasonId, 'teamkills');
          if (killerUser && killerUser.squadId) {
            await statsService.incrementSquadSeasonStats(killerUser.squadId, seasonId, 'teamkills');
          }
        }
      } catch (err) {
        console.error('[KillLogController] Ошибка при обработке тимкилла:', err, event);
      }
    }
    // Жертве засчитываем только смерть
    if (victimIdentity) {
      try {
        const victimUser = await db.User.findOne({ where: { armaId: victimIdentity } });
        await statsService.incrementUserStats(victimIdentity, 'deaths');
        if (victimUser && victimUser.squadId) {
          await statsService.incrementSquadStats(victimUser.squadId, 'deaths');
        }
        if (seasonId) {
          await statsService.incrementPlayerSeasonStats(victimIdentity, seasonId, 'deaths');
          if (victimUser && victimUser.squadId) {
            await statsService.incrementSquadSeasonStats(victimUser.squadId, seasonId, 'deaths');
          }
        }
      } catch (err) {
        console.error('[KillLogController] Ошибка при обновлении статистики жертвы:', err, event);
      }
    }
    // --- Суицид ---
    if (isSuicide && victimIdentity) {
      try {
        const victimUser = await db.User.findOne({ where: { armaId: victimIdentity } });
        await statsService.incrementUserStats(victimIdentity, 'deaths');
        if (victimUser && victimUser.squadId) {
          await statsService.incrementSquadStats(victimUser.squadId, 'deaths');
        }
        if (seasonId) {
          await statsService.incrementPlayerSeasonStats(victimIdentity, seasonId, 'deaths');
          if (victimUser && victimUser.squadId) {
            await statsService.incrementSquadSeasonStats(victimUser.squadId, seasonId, 'deaths');
          }
        }
      } catch (err) {
        console.error('[KillLogController] Ошибка при обработке суицида:', err, event);
      }
    }
    // --- Обычное убийство ---
    if (!isFriendly && !isSuicide && killerIdentity) {
      try {
        const killerUser = await db.User.findOne({ where: { armaId: killerIdentity } });
        await statsService.incrementUserStats(killerIdentity, 'kills');
        if (killerUser && killerUser.squadId) {
          await statsService.incrementSquadStats(killerUser.squadId, 'kills');
        }
        if (seasonId) {
          await statsService.incrementPlayerSeasonStats(killerIdentity, seasonId, 'kills');
          if (killerUser && killerUser.squadId) {
            await statsService.incrementSquadSeasonStats(killerUser.squadId, seasonId, 'kills');
          }
        }
      } catch (err) {
        console.error('[KillLogController] Ошибка при обновлении статистики убийцы:', err, event);
      }
    }
  } catch (err) {
    console.error('[KillLogController] Критическая ошибка в processKillEvent:', err, event);
    throw err;
  }
}

module.exports = { processKillEvent }; 