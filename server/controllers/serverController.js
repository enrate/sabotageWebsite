const {GameDig} = require('gamedig');

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
    console.log(state)
    cachedServerData = [{
      id: 1,
      name: 'Sabotage / Quick TvT',
      status: 'online',
      players: state.players.length,
      maxPlayers: state.maxplayers,
      map: state.map,
      game: state.raw ? state.raw.game : undefined,
      version: state.raw ? state.raw.version : undefined,
      raw: state
    }];
  }).catch((err) => {
    console.log('Gamedig error:', err);
    cachedServerData = [{
      id: 1,
      name: 'Arma Reforger Server',
      status: 'offline',
      players: 0,
      error: 'Сервер недоступен'
    }];
  });
}


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Запуск обновления кэша раз в минуту
updateServerCache();
setInterval(updateServerCache, 120 * 1000);

exports.getServers = async (req, res) => {
  try {
    // Отдаём только кэшированные данные
    res.json(cachedServerData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};