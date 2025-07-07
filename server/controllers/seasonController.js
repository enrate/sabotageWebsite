const { User, Squad, Season, Award } = require('../models');

// Топ игроков по elo
exports.getTopPlayers = async (req, res) => {
  try {
    const players = await User.findAll({
      where: { role: ['user', 'admin', 'member', 'deputy'] },
      order: [['elo', 'DESC']],
      limit: 20,
      attributes: ['id', 'username', 'avatar', 'elo', 'kills', 'deaths', 'teamkills', 'winrate', 'matches']
    });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения топа игроков' });
  }
};

// Топ отрядов по elo (из stats)
exports.getTopSquads = async (req, res) => {
  try {
    const squads = await Squad.findAll();
    // Парсим stats и сортируем по elo
    const enriched = squads.map(sq => {
      const stats = sq.stats ? (typeof sq.stats === 'string' ? JSON.parse(sq.stats) : sq.stats) : {};
      return {
        id: sq.id,
        name: sq.name,
        avatar: sq.logo || '',
        elo: stats.elo || 0,
        kills: stats.kills || 0,
        deaths: stats.deaths || 0,
        teamkills: stats.teamkills || 0,
        winrate: stats.avg_winRate || 0,
        matches: stats.matches || 0,
      };
    }).sort((a, b) => b.elo - a.elo).slice(0, 20);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения топа отрядов' });
  }
};

exports.getAllSeasons = async (req, res) => {
  const seasons = await Season.findAll({
    include: [
      { model: Award, as: 'trophy1' },
      { model: Award, as: 'trophy2' },
      { model: Award, as: 'trophy3' }
    ],
    order: [['startDate', 'DESC']]
  });
  res.json(seasons);
};

exports.getSeason = async (req, res) => {
  const season = await Season.findByPk(req.params.id, {
    include: [
      { model: Award, as: 'trophy1' },
      { model: Award, as: 'trophy2' },
      { model: Award, as: 'trophy3' }
    ]
  });
  if (!season) return res.status(404).json({ message: 'Сезон не найден' });
  res.json(season);
};

exports.createSeason = async (req, res) => {
  const { name, startDate, endDate, trophy1Id, trophy2Id, trophy3Id } = req.body;
  const season = await Season.create({ name, startDate, endDate, trophy1Id, trophy2Id, trophy3Id });
  res.status(201).json(season);
};

exports.updateSeason = async (req, res) => {
  const { name, startDate, endDate, trophy1Id, trophy2Id, trophy3Id } = req.body;
  const season = await Season.findByPk(req.params.id);
  if (!season) return res.status(404).json({ message: 'Сезон не найден' });
  await season.update({ name, startDate, endDate, trophy1Id, trophy2Id, trophy3Id });
  res.json(season);
};

exports.deleteSeason = async (req, res) => {
  const season = await Season.findByPk(req.params.id);
  if (!season) return res.status(404).json({ message: 'Сезон не найден' });
  await season.destroy();
  res.json({ message: 'Сезон удалён' });
}; 