const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

// Токен и ID приложения лучше хранить в переменных окружения
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let lastServerInfo = null;

function setServerInfo(serverInfo) {
  lastServerInfo = serverInfo;
  if (client.user && serverInfo) {
    client.user.setActivity({
      name: `${serverInfo.players}/${serverInfo.maxPlayers} | Server 1 (1pp)`,
      type: ActivityType.Playing
    });
  }
}

client.once('ready', () => {
  console.log(`[DiscordBot] Авторизован как ${client.user.tag}`);
  if (lastServerInfo) {
    setServerInfo(lastServerInfo);
  }
});

client.on('error', (err) => {
  console.error('[DiscordBot] Ошибка:', err);
});

function startDiscordBot() {
  if (!DISCORD_TOKEN || DISCORD_TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
    console.warn('[DiscordBot] Не задан DISCORD_TOKEN!');
    return;
  }
  client.login(DISCORD_TOKEN);
}

module.exports = {
  startDiscordBot,
  setServerInfo,
  client
}; 