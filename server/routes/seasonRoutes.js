const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');

router.get('/top-players', seasonController.getTopPlayers);
router.get('/top-squads', seasonController.getTopSquads);

// Публичные роуты для сезонов
router.get('/', seasonController.getAllSeasons);
router.get('/:id', seasonController.getSeason);

module.exports = router; 