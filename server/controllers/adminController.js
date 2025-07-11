const { User, Squad, News, SquadWarning, SquadHistory, UserWarning, Notification } = require('../models');

// Получить всех пользователей (для админки)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'username', 'email', 'role', 'description', 'avatar', 
        'elo', 'kills', 'deaths', 'teamkills', 'winrate', 'matches',
        'createdAt', 'isBanned', 'banReason'
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('Ошибка получения пользователей:', err);
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
};

// Обновить пользователя (только для админа)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    const { username, email, role, description } = req.body;
    
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;
    if (description !== undefined) user.description = description;
    
    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Ошибка обновления пользователя:', err);
    res.status(500).json({ message: 'Ошибка обновления пользователя' });
  }
};

// Удалить пользователя (только для админа)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверяем, что не удаляем самого себя
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Нельзя удалить самого себя' });
    }
    
    await user.destroy();
    res.json({ message: 'Пользователь удален' });
  } catch (err) {
    console.error('Ошибка удаления пользователя:', err);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
};

// Заблокировать пользователя
exports.banUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'Укажите причину блокировки' });
    }
    
    user.isBanned = true;
    user.banReason = reason;
    await user.save();
    
    res.json({ message: 'Пользователь заблокирован' });
  } catch (err) {
    console.error('Ошибка блокировки пользователя:', err);
    res.status(500).json({ message: 'Ошибка блокировки пользователя' });
  }
};

// Разблокировать пользователя
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    user.isBanned = false;
    user.banReason = null;
    await user.save();
    
    res.json({ message: 'Пользователь разблокирован' });
  } catch (err) {
    console.error('Ошибка разблокировки пользователя:', err);
    res.status(500).json({ message: 'Ошибка разблокировки пользователя' });
  }
};

// Выдать предупреждение отряду
exports.issueSquadWarning = async (req, res) => {
  const { squadId } = req.params;
  const { reason, description } = req.body;
  
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    
    const warning = await SquadWarning.create({
      squadId,
      adminId: req.user.id,
      reason,
      description: description ? description.slice(0, 150) : null
    });
    
    // Создаем запись в истории отряда
    await SquadHistory.create({
      squadId,
      userId: req.user.id,
      eventType: 'warning',
      description: `Администратор ${req.user.username} выдал предупреждение: ${reason}${description ? ' — ' + description : ''}`,
      metadata: {
        warningId: warning.id,
        reason: reason,
        description: description
      }
    });
    
    res.status(201).json(warning);
  } catch (err) {
    console.error('Ошибка выдачи предупреждения:', err);
    res.status(500).json({ message: 'Ошибка выдачи предупреждения' });
  }
};

// Получить предупреждения отряда
exports.getSquadWarnings = async (req, res) => {
  const { squadId } = req.params;
  
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    
    const warnings = await SquadWarning.findAll({
      where: { squadId, isActive: true },
      include: [
        { model: User, as: 'admin', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(warnings);
  } catch (err) {
    console.error('Ошибка получения предупреждений:', err);
    res.status(500).json({ message: 'Ошибка получения предупреждений' });
  }
};

// Отменить предупреждение
exports.cancelSquadWarning = async (req, res) => {
  const { warningId } = req.params;
  
  try {
    const warning = await SquadWarning.findByPk(warningId);
    if (!warning) {
      return res.status(404).json({ message: 'Предупреждение не найдено' });
    }
    
    warning.isActive = false;
    await warning.save();
    
    // Создаем запись в истории отряда
    await SquadHistory.create({
      squadId: warning.squadId,
      userId: req.user.id,
      eventType: 'warning_cancel',
      description: `Администратор ${req.user.username} отменил предупреждение: ${warning.reason}`,
      metadata: {
        warningId: warning.id,
        originalReason: warning.reason
      }
    });
    
    res.json({ message: 'Предупреждение отменено' });
  } catch (err) {
    console.error('Ошибка отмены предупреждения:', err);
    res.status(500).json({ message: 'Ошибка отмены предупреждения' });
  }
};

// Выдать предупреждение пользователю
exports.issueUserWarning = async (req, res) => {
  const { userId } = req.params;
  const { reason, description } = req.body;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    const warning = await UserWarning.create({
      userId,
      adminId: req.user.id,
      reason,
      description: description ? description.slice(0, 150) : null
    });
    // Создать уведомление
    if (Notification) {
      const notifMessage = `Вам выдано предупреждение за "${reason}" от ${req.user.username}`;
      await Notification.create({
        userId: userId,
        type: 'user_warning',
        data: { warningId: warning.id, reason, description },
        message: notifMessage,
        isRead: false
      });
    }
    res.status(201).json(warning);
  } catch (err) {
    console.error('Ошибка выдачи предупреждения пользователю:', err);
    res.status(500).json({ message: 'Ошибка выдачи предупреждения' });
  }
};

// Получить предупреждения пользователя
exports.getUserWarnings = async (req, res) => {
  const { userId } = req.params;
  const showAll = req.query.all === '1' || req.query.all === 'true';
  try {
    const warnings = await UserWarning.findAll({
      where: showAll ? { userId } : { userId, isActive: true },
      include: [
        { model: User, as: 'admin', attributes: ['id', 'username'] },
        { model: User, as: 'canceledByAdmin', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(warnings);
  } catch (err) {
    console.error('Ошибка получения предупреждений пользователя:', err);
    res.status(500).json({ message: 'Ошибка получения предупреждений' });
  }
};

// Отменить предупреждение пользователя
exports.cancelUserWarning = async (req, res) => {
  const { warningId } = req.params;
  try {
    const warning = await UserWarning.findByPk(warningId);
    if (!warning) {
      return res.status(404).json({ message: 'Предупреждение не найдено' });
    }
    warning.isActive = false;
    warning.canceledBy = req.user.id;
    warning.canceledAt = new Date();
    await warning.save();
    res.json({ message: 'Предупреждение отменено' });
  } catch (err) {
    console.error('Ошибка отмены предупреждения пользователя:', err);
    res.status(500).json({ message: 'Ошибка отмены предупреждения' });
  }
};