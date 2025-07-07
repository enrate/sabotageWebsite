const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');

router.get('/', serverController.getServers);

module.exports = router;