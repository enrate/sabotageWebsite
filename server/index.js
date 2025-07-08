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
dayjs.extend(utc);
dayjs.extend(timezone);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  if (!winningFactionKey) return false;
  const entityToFactionMap = new Map();
  jsonData.Factions.forEach(faction => {
    faction.Groups.forEach(group => {
      group.Playables.forEach(playable => {
        entityToFactionMap.set(playable.EntityId, faction.Key);
      });
    });
  });
  const playerToEntityMap = new Map();
  jsonData.PlayersToPlayables.forEach(mapping => {
    playerToEntityMap.set(mapping.PlayerId, mapping.EntityId);
  });
  return jsonData.Players.map(player => {
    const entityId = playerToEntityMap.get(player.PlayerId);
    const faction = entityId ? entityToFactionMap.get(entityId) : "unknown";
    const result = faction === winningFactionKey ? "win" : "lose";
    return {
      playerIdentity: player.GUID,
      result,
    };
  });
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
        console.log(event);
        if (event.name === 'logger_player_killed') {
          const killLog = await db.KillLog.create({
            friendlyFire: !!event.data.friendlyFire,
            suicide: !!event.data.suicide,
            killerIdentity: event.data.killerIdentity || null,
            victimIdentity: event.data.victimIdentity || null,
            timestamp: event.data.timestamp ? new Date(event.data.timestamp * 1000) : new Date(),
          });

          // --- Определяем текущий сезон ---
          const now = new Date();
          const currentSeason = await db.Season.findOne({
            where: {
              startDate: { [db.Sequelize.Op.lte]: now },
              endDate: { [db.Sequelize.Op.gte]: now }
            },
            order: [['startDate', 'DESC']]
          });
          const seasonId = currentSeason ? currentSeason.id : null;

          const { killerIdentity, victimIdentity } = event.data;
          // Обновить статистику убийцы
          if (killerIdentity) {
            const killerUser = await db.User.findOne({ where: { armaId: killerIdentity } });
            if (killerUser) {
              // --- Общая статистика ---
              const [stats, created] = await db.UserStats.findOrCreate({
                where: { armaId: killerIdentity },
                defaults: { userId: killerUser.id, armaId: killerIdentity, kills: 0, deaths: 0 }
              });
              await stats.increment('kills');
              await stats.update({ lastUpdated: new Date() });
              // --- squad_stats ---
              if (killerUser.squadId) {
                const [squadStats, squadCreated] = await db.SquadStats.findOrCreate({
                  where: { squadId: killerUser.squadId },
                  defaults: { squadId: killerUser.squadId, kills: 0, deaths: 0 }
                });
                await squadStats.increment('kills');
                await squadStats.update({ lastUpdated: new Date() });
              }
              // --- player_season_stats ---
              if (seasonId) {
                const [seasonStats, seasonCreated] = await db.PlayerSeasonStats.findOrCreate({
                  where: { userId: killerUser.id, armaId: killerIdentity, seasonId },
                  defaults: { userId: killerUser.id, armaId: killerIdentity, seasonId, kills: 0, deaths: 0 }
                });
                await seasonStats.increment('kills');
                await seasonStats.update({ lastUpdated: new Date() });
                // --- squad_season_stats ---
                if (killerUser.squadId) {
                  const [squadSeasonStats, squadSeasonCreated] = await db.SquadSeasonStats.findOrCreate({
                    where: { squadId: killerUser.squadId, seasonId },
                    defaults: { squadId: killerUser.squadId, seasonId, kills: 0, deaths: 0 }
                  });
                  await squadSeasonStats.increment('kills');
                  await squadSeasonStats.update({ lastUpdated: new Date() });
                }
              }
            }
          }
          // Обновить статистику жертвы
          if (victimIdentity) {
            const victimUser = await db.User.findOne({ where: { armaId: victimIdentity } });
            if (victimUser) {
              // --- Общая статистика ---
              const [stats, created] = await db.UserStats.findOrCreate({
                where: { armaId: victimIdentity },
                defaults: { userId: victimUser.id, armaId: victimIdentity, kills: 0, deaths: 0 }
              });
              await stats.increment('deaths');
              await stats.update({ lastUpdated: new Date() });
              // --- squad_stats ---
              if (victimUser.squadId) {
                const [squadStats, squadCreated] = await db.SquadStats.findOrCreate({
                  where: { squadId: victimUser.squadId },
                  defaults: { squadId: victimUser.squadId, kills: 0, deaths: 0 }
                });
                await squadStats.increment('deaths');
                await squadStats.update({ lastUpdated: new Date() });
              }
              // --- player_season_stats ---
              if (seasonId) {
                const [seasonStats, seasonCreated] = await db.PlayerSeasonStats.findOrCreate({
                  where: { userId: victimUser.id, armaId: victimIdentity, seasonId },
                  defaults: { userId: victimUser.id, armaId: victimIdentity, seasonId, kills: 0, deaths: 0 }
                });
                await seasonStats.increment('deaths');
                await seasonStats.update({ lastUpdated: new Date() });
                // --- squad_season_stats ---
                if (victimUser.squadId) {
                  const [squadSeasonStats, squadSeasonCreated] = await db.SquadSeasonStats.findOrCreate({
                    where: { squadId: victimUser.squadId, seasonId },
                    defaults: { squadId: victimUser.squadId, seasonId, kills: 0, deaths: 0 }
                  });
                  await squadSeasonStats.increment('deaths');
                  await squadSeasonStats.update({ lastUpdated: new Date() });
                }
              }
            }
          }
        }
      }
    } else if (req.body.Factions) {
      console.log(req.body)
      // Обработка результатов игроков
      const winningFactionKey = getWinner(req.body.FactionResults);
      const sessionId = req.body.SessionId || String(Date.now());
      const timestamp = req.body.Timestamp ? new Date(req.body.Timestamp * 1000) : new Date();
      const playersResults = getAllPlayersResults(req.body, winningFactionKey);
      if (playersResults && Array.isArray(playersResults)) {
        for (const player of playersResults) {
          await db.PlayerResult.create({
            playerIdentity: player.playerIdentity,
            result: player.result,
            sessionId,
            timestamp,
          });
        }
      }
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