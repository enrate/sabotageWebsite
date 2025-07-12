require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const routes = require('./routes');
const { protect, admin } = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const issueSeasonAwards = require('./cron/issueSeasonAwards');
const db = require('./models');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');
const path = require('path');
const { processKillEvent } = require('./controllers/killLogController');
const { processMatchResults } = require('./controllers/matchResultController');
const session = require('express-session');
dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();

// Middleware
const corsOptions = {
  origin: 'https://sabotage-games.ru', // Укажи точный домен фронта
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'none', // для работы между доменами по HTTPS
    secure: true      // только по HTTPS
  }
}));

// Подключение к PostgreSQL
sequelize.authenticate()
.then(() => {
  console.log('PostgreSQL connected');
  return sequelize.sync({ alter: true }); // Синхронизация моделей с базой данных
})
.then(() => {
  console.log('Database synchronized');
})
.catch(err => {
  console.error('Database connection error:', err);
});

function getWinner(factionResults) {
  if (!factionResults || factionResults.length === 0) return false;
  const maxScore = Math.max(...factionResults.map(f => f.ResultScore));
  if (maxScore === 0) return false;
  const winners = factionResults.filter(f => f.ResultScore === maxScore).map(f => f.ResultFactionKey);
  return winners.length === 1 ? winners[0] : false;
}

function getAllPlayersResults(jsonData, winningFactionKey) {
  // Собираем всех игроков из Players
  const entityToFactionMap = new Map();
  if (jsonData.Factions) {
    jsonData.Factions.forEach(faction => {
      faction.Groups.forEach(group => {
        group.Playables.forEach(playable => {
          entityToFactionMap.set(playable.EntityId, faction.Key);
        });
      });
    });
  }
  const playerToEntityMap = new Map();
  if (jsonData.PlayersToPlayables) {
    jsonData.PlayersToPlayables.forEach(mapping => {
      playerToEntityMap.set(mapping.PlayerId, mapping.EntityId);
    });
  }
  let results = [];
  if (jsonData.Players) {
    results = jsonData.Players.map(player => {
      const entityId = playerToEntityMap.get(player.PlayerId);
      const faction = entityId ? entityToFactionMap.get(entityId) : "unknown";
      let result;
      if (!winningFactionKey) {
        result = "draw";
      } else {
        result = faction === winningFactionKey ? "win" : "lose";
      }
      return {
        playerIdentity: player.GUID,
        result,
      };
    });
  }
  // --- ДОБАВЛЯЕМ ВСЕХ ИЗ KillLog, если их нет в results ---
  if (jsonData.KillLog) {
    for (const log of jsonData.KillLog) {
      if (log.killerIdentity && !results.find(r => r.playerIdentity === log.killerIdentity)) {
        results.push({ playerIdentity: log.killerIdentity, result: "draw" });
      }
      if (log.victimIdentity && !results.find(r => r.playerIdentity === log.victimIdentity)) {
        results.push({ playerIdentity: log.victimIdentity, result: "draw" });
      }
    }
  }
  return results;
}

// Простой POST /api/server/data с проверкой Bearer токена
app.post('/api/server/data', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== process.env.EVENTS_API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { events } = req.body;
    if (Array.isArray(events)) {
      for (const event of events) {
        if (event.name === 'logger_player_killed') {
          // --- ВЫЗЫВАЕМ КОНТРОЛЛЕР ---
          // --- Определяем текущий сезон ---
          const now = new Date();
          const currentSeason = await require('./models').Season.findOne({
            where: {
              startDate: { [require('./models').Sequelize.Op.lte]: now },
              endDate: { [require('./models').Sequelize.Op.gte]: now }
            },
            order: [['startDate', 'DESC']]
          });
          const seasonId = currentSeason ? currentSeason.id : null;
          await processKillEvent(event, seasonId);
        }
      }
    }
    // --- Если есть Factions/FactionResults ---
    if (req.body.Factions) {
      await processMatchResults(req, res);
      return;
    }
    res.status(200).json({ message: 'Данные получены и обработаны' });
  } catch (err) {
    console.error('Ошибка при обработке событий:', err);
    res.status(500).json({ error: 'Ошибка при обработке событий' });
  }
});

// Роуты
app.use('/api', routes);

// Production static
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// --- REST API ---
const REST_PORT = process.env.REST_PORT || 5000;
app.listen(REST_PORT, () => {
  console.log(`REST API running on port ${REST_PORT}`);
});

// --- SOCKET.IO ---
const { Server } = require('socket.io');
const io = new Server({
  cors: { origin: '*' },
});
const SOCKET_PORT = process.env.SOCKET_PORT || 5001;
io.listen(SOCKET_PORT);
console.log(`Socket.io running on port ${SOCKET_PORT}`);

io.on('connection', (socket) => {
  console.log('Socket connected');
});

cron.schedule('0 3 * * *', async () => {
await issueSeasonAwards();
});