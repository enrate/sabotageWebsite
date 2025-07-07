const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Получить все уведомления пользователя
router.get('/', protect, notificationController.getUserNotifications);
// Создать уведомление (может быть вызвано сервером)
router.post('/', notificationController.createNotification);
// Пометить все как прочитанные
router.post('/read', protect, notificationController.markAsRead);
// Удалить уведомление
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router; 