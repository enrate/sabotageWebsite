require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');
const qs = require('querystring');

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/discord/callback';
const DISCORD_SCOPE = 'identify';

// 1. Редирект на Discord OAuth2
exports.startOAuth = (req, res) => {
  console.log('SESSION DEBUG:', req.session);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  const userId = req.session && req.session.userId;
  if (!userId) return res.status(401).send('Not authorized');
  const state = userId; // Можно добавить CSRF protection
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${DISCORD_SCOPE}&state=${state}`;
  res.redirect(url);
};

// 2. Callback от Discord
exports.handleCallback = async (req, res) => {
  const { code, state } = req.query;
  const userId = req.session && req.session.userId;
  if (!code || !state || !userId) return res.status(400).json({ error: 'Нет кода авторизации, state или userId' });
  try {
    // Получаем access_token
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      qs.stringify({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: DISCORD_SCOPE
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    const { access_token } = tokenRes.data;
    // Получаем инфу о пользователе
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const { id, username, discriminator } = userRes.data;
    // Сохраняем в профиль
    await User.update({
      discordId: id,
      discordUsername: `${username}#${discriminator}`
    }, { where: { id: userId } });
    // Можно редиректить на фронт с успехом
    res.redirect('/settings?discord=success');
  } catch (err) {
    console.error('[Discord OAuth2]', err);
    res.redirect('/settings?discord=error');
  }
};

// 3. Отвязать Discord
exports.unlinkDiscord = async (req, res) => {
  try {
    await User.update({ discordId: null, discordUsername: null }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отвязке Discord' });
  }
}; 