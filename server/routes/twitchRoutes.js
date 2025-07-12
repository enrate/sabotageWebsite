const express = require('express');
const router = express.Router();
const twitchController = require('../controllers/twitchController');
const { protect } = require('../middleware/authMiddleware');

// Начать OAuth2 процесс
router.get('/start', twitchController.startOAuth);
// Callback от Twitch
router.get('/callback', twitchController.handleCallback);
// Отвязать Twitch
router.post('/unlink', protect, twitchController.unlinkTwitch);

module.exports = router; 