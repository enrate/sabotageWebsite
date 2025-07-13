const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const { protect } = require('../middleware/authMiddleware');

// Начать OAuth2 процесс
router.get('/start', youtubeController.startOAuth);
// Callback от YouTube
router.get('/callback', youtubeController.handleCallback);
// Отвязать YouTube
router.post('/unlink', protect, youtubeController.unlinkYoutube);

module.exports = router; 