const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const awardController = require('../controllers/awardController');
const seasonController = require('../controllers/seasonController');
const { uploadImage, handleUploadError } = require('../middleware/uploadMiddleware');
const newsController = require('../controllers/newsController');
const matchHistoryController = require('../controllers/matchHistoryController');

// Маршруты для управления пользователями
router.get('/users', protect, admin, adminController.getUsers);
router.patch('/users/:id', protect, admin, adminController.updateUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);
router.post('/users/:id/ban', protect, admin, adminController.banUser);
router.post('/users/:id/unban', protect, admin, adminController.unbanUser);

// Маршруты для предупреждений отрядам
router.post('/squads/:squadId/warnings', protect, admin, adminController.issueSquadWarning);
router.get('/squads/:squadId/warnings', protect, admin, adminController.getSquadWarnings);
router.patch('/warnings/:warningId/cancel', protect, admin, adminController.cancelSquadWarning);

// Маршруты для предупреждений пользователям
router.post('/users/:userId/warnings', protect, admin, adminController.issueUserWarning);
router.get('/users/:userId/warnings', protect, admin, adminController.getUserWarnings);
router.patch('/user-warnings/:warningId/cancel', protect, admin, adminController.cancelUserWarning);

// --- Роуты для наград ---
router.get('/awards', protect, admin, awardController.getAllAwards);
router.get('/awards/:id', protect, admin, awardController.getAwardById);
router.post('/awards', protect, admin, uploadImage, handleUploadError, awardController.createAward);
router.put('/awards/:id', protect, admin, uploadImage, handleUploadError, awardController.updateAward);
router.delete('/awards/:id', protect, admin, awardController.deleteAward);
// Выдача наград
router.post('/awards/give/user', protect, admin, awardController.assignAwardToUser);
router.post('/awards/give/squad', protect, admin, awardController.giveAwardToSquad);
// Получение наград пользователя/отряда
router.get('/awards/user/:userId', protect, admin, awardController.getUserAwards);
// router.get('/awards/squad/:squadId', protect, admin, awardController.getSquadAwards); // TODO: добавить метод
// --- Управление вручением и отзывом наград ---
router.delete('/awards/user-award/:userAwardId', protect, admin, awardController.revokeAwardFromUser);
// router.delete('/awards/squad-award/:squadAwardId', protect, admin, awardController.removeAwardFromSquad); // TODO: добавить метод
// router.get('/awards/:awardId/recipients', protect, admin, awardController.getAwardRecipients); // TODO: добавить метод

// --- Роуты для сезонов ---
router.get('/seasons', protect, admin, seasonController.getAllSeasons);
router.get('/seasons/:id', protect, admin, seasonController.getSeason);
router.post('/seasons', protect, admin, seasonController.createSeason);
router.put('/seasons/:id', protect, admin, seasonController.updateSeason);
router.delete('/seasons/:id', protect, admin, seasonController.deleteSeason);

// --- Роуты для новостей (админка) ---
router.get('/news', protect, admin, newsController.getNews);
router.get('/news/:id', protect, admin, newsController.getNewsById);
router.post('/news', protect, admin, newsController.createNews);
router.put('/news/:id', protect, admin, newsController.updateNews);
router.delete('/news/:id', protect, admin, newsController.deleteNews);

// --- Роуты для истории матчей (админка) ---
router.get('/match-history', protect, admin, matchHistoryController.getMatchHistory);

// --- Роуты для токена админа ---
router.post('/generate-token', protect, admin, adminController.generateAdminToken);
router.post('/verify-token', adminController.verifyAdminToken);

module.exports = router;