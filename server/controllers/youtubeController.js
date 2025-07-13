require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');
const qs = require('querystring');

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || 'YOUR_YOUTUBE_CLIENT_ID';
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || 'YOUR_YOUTUBE_CLIENT_SECRET';
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3001/youtube/callback';
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

// 1. Редирект на YouTube OAuth2
exports.startOAuth = (req, res) => {
  console.log('SESSION DEBUG:', req.session);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  const userId = req.session && req.session.userId;
  if (!userId) return res.status(401).send('Not authorized');
  const state = userId; // Можно добавить CSRF protection
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(YOUTUBE_SCOPE)}&state=${state}`;
  res.redirect(url);
};

// 2. Callback от YouTube
exports.handleCallback = async (req, res) => {
  const { code, state } = req.query;
  const userId = req.session && req.session.userId;
  if (!code || !state || !userId) return res.status(400).json({ error: 'Нет кода авторизации, state или userId' });
  try {
    // Получаем access_token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token',
      qs.stringify({
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        scope: YOUTUBE_SCOPE
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    const { access_token } = tokenRes.data;
    
    // Получаем информацию о YouTube канале
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      headers: { 
        'Authorization': `Bearer ${access_token}`
      },
      params: {
        part: 'snippet',
        mine: true
      }
    });
    
    if (channelRes.data.items && channelRes.data.items.length > 0) {
      const channel = channelRes.data.items[0];
      const { id, snippet } = channel;
      const channelName = snippet.title;
      
      // Сохраняем в профиль
      await User.update({
        youtubeId: id,
        youtubeUsername: channelName
      }, { where: { id: userId } });
    } else {
      throw new Error('YouTube канал не найден');
    }
    
    // Можно редиректить на фронт с успехом
    res.redirect('/settings?youtube=success');
  } catch (err) {
    console.error('[YouTube OAuth2]', err);
    const errorMessage = err.message === 'YouTube канал не найден' ? 'no-channel' : 'error';
    res.redirect(`/settings?youtube=${errorMessage}`);
  }
};

// 3. Отвязать YouTube
exports.unlinkYoutube = async (req, res) => {
  try {
    await User.update({ youtubeId: null, youtubeUsername: null }, { where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отвязке YouTube' });
  }
}; 