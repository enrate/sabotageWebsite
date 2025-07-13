const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const { protect } = require('../middleware/authMiddleware');

// Привязать YouTube канал по ссылке
router.post('/link', protect, youtubeController.linkYoutubeByUrl);
// Отвязать YouTube
router.post('/unlink', protect, youtubeController.unlinkYoutube);

module.exports = router; 