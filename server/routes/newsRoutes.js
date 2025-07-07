const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', newsController.getNews);
router.get('/latest', newsController.getLatestNews);
router.get('/:id', newsController.getNewsById);
router.post('/', protect, newsController.createNews);
router.put('/:id', protect, newsController.updateNews);
router.patch('/:id', protect, newsController.updateNews);
router.delete('/:id', protect, newsController.deleteNews);

module.exports = router;