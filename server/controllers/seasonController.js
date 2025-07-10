const { User, Squad, Season, Award, PlayerSeasonStats, SquadSeasonStats } = require('../models');

// Топ игроков по elo
exports.getTopPlayers = async (req, res) => {
  try {
    const { seasonId } = req.query;
    if (seasonId) {
      // Топ игроков по сезону
      const stats = await PlayerSeasonStats.findAll({
        where: { seasonId, userId: { [require('sequelize').Op.ne]: null } },
        order: [['elo', 'DESC']],
        limit: 20
      });
      // Получаем пользователей для отображения username/avatar
      const userIds = stats.map(s => s.userId).filter(Boolean);
      const users = userIds.length ? await User.findAll({ where: { id: userIds } }) : [];
      const result = stats.map(s => {
        const user = users.find(u => u.id === s.userId) || {};
        return {
          id: s.userId,
          username: user.username || s.armaId,
          avatar: user.avatar || '',
          elo: s.elo,
          kills: s.kills,
          deaths: s.deaths,
          teamkills: s.teamkills,
          winrate: s.matches ? Math.round((s.wins / s.matches) * 100) : 0,
          matches: s.matches
        };
      });
      return res.json(result);
    }
    // Старое поведение (общая статистика)
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
    const { seasonId } = req.query;
    if (seasonId) {
      // Топ отрядов по сезону
      const stats = await SquadSeasonStats.findAll({
        where: { seasonId },
        order: [['elo', 'DESC']],
        limit: 20
      });
      // Получаем отряды для отображения name/logo
      const squadIds = stats.map(s => s.squadId).filter(Boolean);
      const squads = squadIds.length ? await Squad.findAll({ where: { id: squadIds } }) : [];
      const result = stats.map(s => {
        const squad = squads.find(q => q.id === s.squadId) || {};
        return {
          id: s.squadId,
          name: squad.name || `Отряд #${s.squadId}`,
          avatar: squad.logo || '',
          elo: s.elo,
          kills: s.kills,
          deaths: s.deaths,
          teamkills: s.teamkills,
          winrate: s.matches ? Math.round((s.wins / s.matches) * 100) : 0,
          matches: s.matches
        };
      });
      return res.json(result);
    }
    // Старое поведение (общая статистика)
    const squads = await Squad.findAll();
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
  try {
    const seasons = await Season.findAll({
      include: [
        { model: Award, as: 'trophy1' },
        { model: Award, as: 'trophy2' },
        { model: Award, as: 'trophy3' }
      ],
      order: [['startDate', 'DESC']]
    });
    // Для каждого сезона добавляем только пользователей с userId
    const seasonsWithPlayers = [];
    for (const season of seasons) {
      const playerStats = await PlayerSeasonStats.findAll({
        where: { seasonId: season.id, userId: { [require('sequelize').Op.ne]: null } }
      });
      seasonsWithPlayers.push({
        ...season.toJSON(),
        playerStats
      });
    }
    res.json(seasonsWithPlayers);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения сезонов' });
  }
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

// Получить сезонную статистику игрока
exports.getPlayerSeasonStats = async (req, res) => {
  try {
    const { userId, seasonId } = req.query;
    if (!userId || !seasonId) return res.status(400).json({ message: 'userId и seasonId обязательны' });
    const stats = await PlayerSeasonStats.findOne({ where: { userId, seasonId } });
    if (!stats) return res.status(404).json({ message: 'Нет данных по игроку за сезон' });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения сезонной статистики игрока' });
  }
};

// Получить сезонную статистику отряда
exports.getSquadSeasonStats = async (req, res) => {
  try {
    const { squadId, seasonId } = req.query;
    if (!squadId || !seasonId) return res.status(400).json({ message: 'squadId и seasonId обязательны' });
    const stats = await SquadSeasonStats.findOne({ where: { squadId, seasonId } });
    if (!stats) return res.status(404).json({ message: 'Нет данных по отряду за сезон' });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения сезонной статистики отряда' });
  }
}; 