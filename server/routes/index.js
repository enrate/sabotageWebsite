const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const newsRoutes = require('./newsRoutes');
const squadRoutes = require('./squadRoutes');
const serverRoutes = require('./serverRoutes');
const adminRoutes = require('./adminRoutes');
const userRoutes = require('./userRoutes');
const commentRoutes = require('./commentRoutes');
const messageRoutes = require('./messageRoutes');
const notificationRoutes = require('./notificationRoutes');
const seasonRoutes = require('./seasonRoutes');
const discordRoutes = require('./discordRoutes');
const twitchRoutes = require('./twitchRoutes');

router.use('/auth', authRoutes);
router.use('/news', newsRoutes);
router.use('/squads', squadRoutes);
router.use('/servers', serverRoutes);
router.use('/server', serverRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/comments', commentRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/seasons', seasonRoutes);
router.use('/discord', discordRoutes);
router.use('/twitch', twitchRoutes);

module.exports = router;