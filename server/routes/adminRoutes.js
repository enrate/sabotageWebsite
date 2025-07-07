const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const awardController = require('../controllers/awardController');
const { protect: protectOnlyAdmin, adminOnly } = require('../middleware/authMiddleware');
const seasonController = require('../controllers/seasonController');

// Маршруты для управления пользователями
router.get('/users', protect, admin, adminController.getUsers);
router.patch('/users/:id', protect, admin, adminController.updateUser);
router.delete('/users/:id', protect, admin, adminController.deleteUser);
router.post('/users/:id/ban', protect, admin, adminController.banUser);
router.post('/users/:id/unban', protect, admin, adminController.unbanUser);

// Маршруты для предупреждений отрядам
router.post('/squads/:squadId/warnings', protect, adminController.issueSquadWarning);
router.get('/squads/:squadId/warnings', protect, adminController.getSquadWarnings);
router.patch('/warnings/:warningId/cancel', protect, adminController.cancelSquadWarning);

// Маршруты для предупреждений пользователям
router.post('/users/:userId/warnings', protect, admin, adminController.issueUserWarning);
router.get('/users/:userId/warnings', protect, admin, adminController.getUserWarnings);
router.patch('/user-warnings/:warningId/cancel', protect, admin, adminController.cancelUserWarning);

// --- Роуты для наград ---
router.get('/awards', protect, admin, awardController.getAllAwards);
router.get('/awards/:id', protect, admin, awardController.getAward);
router.post('/awards', protect, admin, awardController.createAward);
router.put('/awards/:id', protect, admin, awardController.updateAward);
router.delete('/awards/:id', protect, admin, awardController.deleteAward);
// Выдача наград
router.post('/awards/give/user', protect, admin, awardController.giveAwardToUser);
router.post('/awards/give/squad', protect, admin, awardController.giveAwardToSquad);
// Получение наград пользователя/отряда
router.get('/awards/user/:userId', protect, admin, awardController.getUserAwards);
router.get('/awards/squad/:squadId', protect, admin, awardController.getSquadAwards);
// --- Управление вручением и отзывом наград ---
router.delete('/awards/user-award/:userAwardId', protect, admin, awardController.removeAwardFromUser);
router.delete('/awards/squad-award/:squadAwardId', protect, admin, awardController.removeAwardFromSquad);
router.get('/awards/:awardId/recipients', protect, admin, awardController.getAwardRecipients);

// --- Роуты для сезонов ---
router.get('/seasons', protect, admin, seasonController.getAllSeasons);
router.get('/seasons/:id', protect, admin, seasonController.getSeason);
router.post('/seasons', protect, admin, seasonController.createSeason);
router.put('/seasons/:id', protect, admin, seasonController.updateSeason);
router.delete('/seasons/:id', protect, admin, seasonController.deleteSeason);

module.exports = router;