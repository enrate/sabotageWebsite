const { Season, Award, UserAward, SquadAward, User, Squad } = require('../models');
const { Op } = require('sequelize');

async function issueSeasonAwards() {
  const now = new Date();
  const seasons = await Season.findAll({
    where: {
      endDate: { [Op.lt]: now },
      awardsIssued: false
    },
    include: [
      { model: Award, as: 'trophy1' },
      { model: Award, as: 'trophy2' },
      { model: Award, as: 'trophy3' }
    ]
  });

  for (const season of seasons) {
    // Получить топ-3 игроков по elo (можно доработать под вашу логику)
    const topPlayers = await User.findAll({
      order: [['elo', 'DESC']],
      limit: 3
    });
    // Получить топ-3 отряда по elo
    const topSquads = await Squad.findAll({
      order: [['elo', 'DESC']],
      limit: 3
    });
    // Выдать награды игрокам
    if (season.trophy1Id && topPlayers[0]) {
      await UserAward.create({ userId: topPlayers[0].id, awardId: season.trophy1Id, issuedBy: 1, issuedAt: now, comment: `Победа в сезоне ${season.name}` });
    }
    if (season.trophy2Id && topPlayers[1]) {
      await UserAward.create({ userId: topPlayers[1].id, awardId: season.trophy2Id, issuedBy: 1, issuedAt: now, comment: `2 место в сезоне ${season.name}` });
    }
    if (season.trophy3Id && topPlayers[2]) {
      await UserAward.create({ userId: topPlayers[2].id, awardId: season.trophy3Id, issuedBy: 1, issuedAt: now, comment: `3 место в сезоне ${season.name}` });
    }
    // Выдать награды отрядам
    if (season.trophy1Id && topSquads[0]) {
      await SquadAward.create({ squadId: topSquads[0].id, awardId: season.trophy1Id, issuedBy: 1, issuedAt: now, comment: `Победа в сезоне ${season.name}` });
    }
    if (season.trophy2Id && topSquads[1]) {
      await SquadAward.create({ squadId: topSquads[1].id, awardId: season.trophy2Id, issuedBy: 1, issuedAt: now, comment: `2 место в сезоне ${season.name}` });
    }
    if (season.trophy3Id && topSquads[2]) {
      await SquadAward.create({ squadId: topSquads[2].id, awardId: season.trophy3Id, issuedBy: 1, issuedAt: now, comment: `3 место в сезоне ${season.name}` });
    }
    // Пометить сезон как награждённый
    season.awardsIssued = true;
    await season.save();
  }
}

module.exports = issueSeasonAwards; 