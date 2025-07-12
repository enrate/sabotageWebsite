const express = require('express');
const router = express.Router();
const discordController = require('../controllers/discordController');
const { protect } = require('../middleware/authMiddleware');

// Начать OAuth2 авторизацию
router.get('/start', discordController.startOAuth);
// Callback от Discord
router.get('/callback', discordController.handleCallback);
// Отвязать Discord
router.post('/unlink', protect, discordController.unlinkDiscord);

module.exports = router; 