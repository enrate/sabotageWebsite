require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');
const qs = require('querystring');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || 'YOUR_TWITCH_CLIENT_ID';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || 'YOUR_TWITCH_CLIENT_SECRET';
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || 'http://localhost:3001/twitch/callback';
const TWITCH_SCOPE = 'user:read:email';

// 1. Редирект на Twitch OAuth2
exports.startOAuth = (req, res) => {
  console.log('SESSION DEBUG:', req.session);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  const userId = req.session && req.session.userId;
  if (!userId) return res.status(401).send('Not authorized');
  const state = userId; // Можно добавить CSRF protection
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=code&scope=${TWITCH_SCOPE}&state=${state}`;
  res.redirect(url);
};

// 2. Callback от Twitch
exports.handleCallback = async (req, res) => {
  const { code, state } = req.query;
  const userId = req.session && req.session.userId;
  if (!code || !state || !userId) return res.status(400).json({ error: 'Нет кода авторизации, state или userId' });
  try {
    // Получаем access_token
    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token',
      qs.stringify({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: TWITCH_REDIRECT_URI,
        scope: TWITCH_SCOPE
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    const { access_token } = tokenRes.data;
    
    // Получаем инфу о пользователе
    const userRes = await axios.get('https://api.twitch.tv/helix/users', {
      headers: { 
        'Authorization': `Bearer ${access_token}`,
        'Client-Id': TWITCH_CLIENT_ID
      }
    });
    
    const userData = userRes.data.data[0];
    const { id, login, display_name } = userData;
    
    // Сохраняем в профиль
    await User.update({
      twitchId: id,
      twitchUsername: login
    }, { where: { id: userId } });
    
    // Можно редиректить на фронт с успехом
    res.redirect('/settings?twitch=success');
  } catch (err) {
    console.error('[Twitch OAuth2]', err);
    res.redirect('/settings?twitch=error');
  }
};

// 3. Отвязать Twitch
exports.unlinkTwitch = async (req, res) => {
  try {
    await User.update({ twitchId: null, twitchUsername: null }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отвязке Twitch' });
  }
}; 