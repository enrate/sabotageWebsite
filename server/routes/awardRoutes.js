const express = require('express');
const router = express.Router();
const awardController = require('../controllers/awardController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadImage, handleUploadError } = require('../middleware/uploadMiddleware');

// Получить все награды (публичный доступ)
router.get('/', awardController.getAllAwards);

// Получить награду по ID (публичный доступ)
router.get('/:id', awardController.getAwardById);

// Получить статистику награды (только админ)
router.get('/:id/statistics', protect, admin, awardController.getAwardStatistics);

// Получить награды пользователя (публичный доступ)
router.get('/user/:userId', awardController.getUserAwards);

// Получить награды сезона (публичный доступ)
router.get('/season/:seasonId', awardController.getSeasonAwards);

// Админские маршруты (требуют авторизации и прав администратора)
router.use(protect, admin);

// Создать новую награду с загрузкой изображения
router.post('/', uploadImage, handleUploadError, awardController.createAward);

// Обновить награду с загрузкой изображения
router.put('/:id', uploadImage, handleUploadError, awardController.updateAward);

// Удалить награду
router.delete('/:id', awardController.deleteAward);

// Назначить награду пользователю
router.post('/assign', awardController.assignAwardToUser);

// Отозвать награду у пользователя
router.delete('/user/:userId/award/:awardId', awardController.revokeAwardFromUser);

// Автоматически назначить награды по условиям
router.post('/:awardId/auto-assign', awardController.autoAssignAwards);

// Выдать награды сезона
router.post('/season/:seasonId/issue', awardController.issueSeasonAwards);

module.exports = router; 