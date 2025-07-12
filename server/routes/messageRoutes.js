const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Получить список диалогов
router.get('/dialogs', protect, messageController.getDialogs);
// Получить чат с пользователем
router.get('/chat/:userId', protect, messageController.getChat);
// Отправить сообщение
router.post('/', protect, messageController.sendMessage);
// Пометить сообщения как прочитанные
router.post('/read/:userId', protect, messageController.markAsRead);
// Получить количество непрочитанных сообщений от пользователя
router.get('/unread/:userId', protect, messageController.getUnreadCount);

module.exports = router; 