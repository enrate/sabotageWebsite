// statsService.js

const db = require('../models');

async function incrementUserStats(armaId, field) {
  const [stats] = await db.UserStats.findOrCreate({
    where: { armaId },
    defaults: { armaId, kills: 0, deaths: 0, teamkills: 0 }
  });
  await stats.increment(field);
  await stats.update({ lastUpdated: new Date() });
}

async function incrementSquadStats(squadId, field) {
  const [stats] = await db.SquadStats.findOrCreate({
    where: { squadId },
    defaults: { squadId, kills: 0, deaths: 0, teamkills: 0 }
  });
  await stats.increment(field);
  await stats.update({ lastUpdated: new Date() });
}

async function incrementPlayerSeasonStats(armaId, seasonId, field) {
  const [stats] = await db.PlayerSeasonStats.findOrCreate({
    where: { armaId, seasonId },
    defaults: { armaId, seasonId, kills: 0, deaths: 0, teamkills: 0 }
  });
  await stats.increment(field);
  await stats.update({ lastUpdated: new Date() });
}

async function incrementSquadSeasonStats(squadId, seasonId, field) {
  const [stats] = await db.SquadSeasonStats.findOrCreate({
    where: { squadId, seasonId },
    defaults: { squadId, seasonId, kills: 0, deaths: 0, teamkills: 0 }
  });
  await stats.increment(field);
  await stats.update({ lastUpdated: new Date() });
}

module.exports = {
  incrementUserStats,
  incrementSquadStats,
  incrementPlayerSeasonStats,
  incrementSquadSeasonStats
}; 