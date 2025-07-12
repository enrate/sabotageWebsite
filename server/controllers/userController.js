const { User } = require('../models');

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'avatar', 'role', 'description', 'email', 'squadId', 'createdAt', 'isLookingForSquad', 'armaId', 'discordId', 'discordUsername', 'twitchId', 'twitchUsername']
    });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    // Скрывать email, если не свой профиль и не админ
    if (!req.user || (req.user.id !== user.id && req.user.role !== 'admin')) {
      user.email = undefined;
    }
    // Добавляем статус верификации
    const verified = !!user.armaId;
    // Добавляем статистику
    let stats = null;
    if (user.armaId) {
      const { UserStats, PlayerSeasonStats } = require('../models');
      const foundStats = await UserStats.findOne({ where: { armaId: user.armaId } });
      // Агрегируем сезонную статистику
      const seasonStats = await PlayerSeasonStats.findAll({ where: { armaId: user.armaId } });
      const totalGames = seasonStats.reduce((sum, s) => sum + (s.matches || 0), 0);
      const totalWins = seasonStats.reduce((sum, s) => sum + (s.wins || 0), 0);
      const totalLosses = seasonStats.reduce((sum, s) => sum + (s.losses || 0), 0);
      const maxElo = foundStats?.maxElo ?? 0;
      const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : null;
      if (foundStats) {
        stats = {
          kills: foundStats.kills,
          deaths: foundStats.deaths,
          teamkills: foundStats.teamkills,
          totalGames,
          wins: totalWins,
          losses: totalLosses,
          winRate,
          maxElo
        };
      }
    }
    // Получаем название отряда, если есть squadId
    let squadName = undefined;
    if (user.squadId) {
      const { Squad } = require('../models');
      const squad = await Squad.findByPk(user.squadId);
      if (squad) squadName = squad.name;
    }
    res.json({ ...user.toJSON(), verified, stats, squadName });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения пользователя' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, description, avatar, armaId, isLookingForSquad } = req.body;
    const userId = req.user.id;

    // Проверяем, что пользователь существует
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Сохраняем старое значение armaId для сравнения
    const oldArmaId = user.armaId;

    // Проверяем уникальность username, если он изменился
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
      }
    }

    // Проверяем уникальность armaId, если он изменился
    if (armaId && armaId !== user.armaId) {
      // Если у пользователя уже есть Arma ID, запрещаем его изменение
      if (user.armaId) {
        return res.status(400).json({ message: 'Arma ID нельзя изменить после установки' });
      }
      
      const existingUser = await User.findOne({ where: { armaId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким Arma ID уже существует' });
      }
    }

    // Обновляем профиль
    let newArmaId = armaId !== undefined ? armaId : user.armaId;
    if (newArmaId === '') newArmaId = null;
    
    console.log('[UserController] Обновление профиля:', {
      userId,
      oldArmaId,
      newArmaId,
      armaIdFromBody: armaId
    });
    
    await user.update({
      username: username || user.username,
      email: user.email, // Email нельзя изменять
      description: description !== undefined ? description : user.description,
      avatar: avatar !== undefined ? avatar : user.avatar,
      armaId: newArmaId, // Сохраняем null вместо пустой строки
      isLookingForSquad: isLookingForSquad !== undefined ? isLookingForSquad : user.isLookingForSquad
    });

    // Если установлен новый armaId, привязываем статистику
    console.log('[UserController] Проверка условия привязки:', {
      newArmaId,
      oldArmaId,
      condition: newArmaId && newArmaId !== oldArmaId
    });
    
    if (newArmaId && newArmaId !== oldArmaId) {
      try {
        console.log('[UserController] Вызываю linkArmaIdToStats для:', { userId, newArmaId });
        await User.linkArmaIdToStats(userId, newArmaId);
        console.log(`[UserController] Привязана статистика для пользователя ${userId} с armaId ${newArmaId}`);
      } catch (err) {
        console.error('[UserController] Ошибка привязки статистики:', err);
        // Не прерываем выполнение, так как профиль уже обновлён
      }
    } else {
      console.log('[UserController] Условие привязки не выполнено');
    }

    // Возвращаем обновленного пользователя
    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'avatar', 'role', 'description', 'email', 'squadId', 'armaId', 'joinDate', 'isLookingForSquad']
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
};

// Получить пользователей, ищущих отряд
exports.getLookingForSquadUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        isLookingForSquad: true,
        squadId: null
      },
      order: [['username', 'ASC']],
      attributes: ['id', 'username', 'avatar', 'description', 'createdAt', 'armaId']
    });
    // Определяем текущий или последний сезон
    const { Season, PlayerSeasonStats } = require('../models');
    const now = new Date();
    let season = await Season.findOne({
      where: {
        startDate: { $lte: now },
        endDate: { $gte: now }
      },
      order: [['startDate', 'DESC']]
    });
    if (!season) {
      // Если нет активного, берём последний по дате старта
      season = await Season.findOne({
        order: [['startDate', 'DESC']]
      });
    }
    const seasonId = season ? season.id : null;
    const usersWithStats = await Promise.all(users.map(async user => {
      let stats = null;
      if (user.armaId && seasonId) {
        const seasonStats = await PlayerSeasonStats.findOne({ where: { armaId: user.armaId, seasonId } });
        if (seasonStats) {
          const winRate = seasonStats.matches > 0 ? ((seasonStats.wins / seasonStats.matches) * 100).toFixed(1) : null;
          stats = {
            kills: seasonStats.kills,
            deaths: seasonStats.deaths,
            teamkills: seasonStats.teamkills,
            matches: seasonStats.matches,
            wins: seasonStats.wins,
            losses: seasonStats.losses,
            winRate,
            elo: seasonStats.elo
          };
        }
      }
      return { ...user.toJSON(), stats };
    }));
    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
};

exports.getSquadTagByPlayerIdentity = async (req, res) => {
  try {
    const { playerIdentity } = req.params;
    // Найти пользователя по armaId
    const user = await require('../models').User.findOne({ where: { armaId: playerIdentity } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким armaId не найден' });
    }
    if (!user.squadId) {
      return res.status(404).json({ error: 'У пользователя нет отряда' });
    }
    // Найти отряд по squadId
    const squad = await require('../models').Squad.findByPk(user.squadId);
    if (!squad || !squad.tag) {
      return res.status(404).json({ error: 'У отряда нет тега' });
    }
    res.status(200).json({ status: 'success', detail: { squad_prefix: squad.tag } });
  } catch (error) {
    console.error('Ошибка обработки:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const { armaId } = req.params;
    const stats = await require('../models').UserStats.findOne({ where: { armaId } });
    if (!stats) {
      return res.status(404).json({ kills: '-', deaths: '-', teamKills: '-', totalGames: '-', winRate: '-', maxElo: '-' });
    }
    res.json({
      kills: stats.kills,
      deaths: stats.deaths,
      teamKills: stats.teamKills ?? '-',
      totalGames: stats.totalGames ?? '-',
      winRate: stats.winRate ?? '-',
      maxElo: stats.maxElo ?? '-'
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
}; 