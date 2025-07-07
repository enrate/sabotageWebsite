const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Получение комментариев к новости (публичный доступ)
router.get('/news/:newsId', commentController.getComments);

// Создание комментария (требует авторизации)
router.post('/', protect, commentController.createComment);

// Обновление комментария (требует авторизации)
router.put('/:id', protect, commentController.updateComment);

// Удаление комментария (требует авторизации)
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router; 