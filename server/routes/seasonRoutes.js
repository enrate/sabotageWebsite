const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');

router.get('/top-players', seasonController.getTopPlayers);
router.get('/top-squads', seasonController.getTopSquads);

// Публичные роуты для сезонов
router.get('/', seasonController.getAllSeasons);
router.get('/:id', seasonController.getSeason);
router.get('/player-stats', seasonController.getPlayerSeasonStats);
router.get('/squad-stats', seasonController.getSquadSeasonStats);

module.exports = router; 