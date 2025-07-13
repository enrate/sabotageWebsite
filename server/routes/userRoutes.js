const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/looking-for-squad', userController.getLookingForSquadUsers);
router.get('/:id', userController.getUserById);
router.get('/:userId/warnings', userController.getUserWarnings);
router.patch('/profile', protect, userController.updateProfile);
router.get('/squad-tag/:playerIdentity', userController.getSquadTagByPlayerIdentity);
router.get('/stats/:armaId', userController.getUserStats);
 
module.exports = router; 