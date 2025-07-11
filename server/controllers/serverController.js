const {GameDig} = require('gamedig');
const discordBot = require('../services/discordBot');

const SERVER_IP = '83.136.235.40';
const SERVER_PORT = 2005;

// Кэш для мониторинга
let cachedServerData = [{
  id: 1,
  name: 'Arma Reforger Server',
  status: 'offline',
  players: 0,
  error: 'Нет данных'
}];

function updateServerCache() {
  GameDig.query({
    type: 'armareforger', // или 'armareforger' если поддерживается
    host: SERVER_IP,
    port: SERVER_PORT,
    maxAttempts: 2,
    socketTimeout: 2000
  }).then((state) => {
    cachedServerData = [{
      id: 1,
      name: 'Sabotage / Quick TvT',
      status: 'online',
      players: state.players.length,
      maxPlayers: state.maxplayers,
      game: state.raw ? state.raw.game : undefined,
      version: state.raw ? state.raw.version : undefined,
      raw: state
    }];
    discordBot.setServerInfo(cachedServerData[0]);
  }).catch((err) => {
    console.log('Gamedig error:', err);
    cachedServerData = [{
      id: 1,
      name: 'Arma Reforger Server',
      status: 'offline',
      players: 0,
      error: 'Сервер недоступен'
    }];
    discordBot.setServerInfo(cachedServerData[0]);
  });
}


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Запуск обновления кэша раз в минуту
updateServerCache();
setInterval(updateServerCache, 120 * 1000);
discordBot.startDiscordBot();

exports.getServers = async (req, res) => {
  try {
    // Отдаём только кэшированные данные
    res.json(cachedServerData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};