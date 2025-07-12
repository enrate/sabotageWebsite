const { Notification, User } = require('../models');
const { createClient } = require('redis');
const redis = createClient({ url: 'redis://localhost:6379' });
redis.connect();

// Получить все уведомления пользователя
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения уведомлений' });
  }
};

// Создать уведомление
exports.createNotification = async (req, res) => {
  try {
    const { userId, type, data } = req.body;
    const notification = await Notification.create({ userId, type, data });
    
    // Публикация в Redis для real-time уведомлений
    await redis.publish('new_notification', JSON.stringify(notification));
    
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка создания уведомления' });
  }
};

// Пометить уведомления как прочитанные
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
    res.json({ message: 'Уведомления помечены как прочитанные' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка обновления уведомлений' });
  }
};

// Удалить уведомление
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await Notification.destroy({ where: { id, userId } });
    res.json({ message: 'Уведомление удалено' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка удаления уведомления' });
  }
}; 