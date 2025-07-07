const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/looking-for-squad', userController.getLookingForSquadUsers);
router.get('/:id', userController.getUserById);
router.patch('/profile', protect, userController.updateProfile);
 
module.exports = router; 