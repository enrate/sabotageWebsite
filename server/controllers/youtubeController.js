require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';

// Извлекаем YouTube канал ID из различных форматов ссылок
exports.extractChannelId = function(url) {
  const patterns = [
    // https://www.youtube.com/channel/UC...
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    // https://www.youtube.com/c/ChannelName
    /youtube\.com\/c\/([^\/\?]+)/,
    // https://www.youtube.com/@username
    /youtube\.com\/@([^\/\?]+)/,
    // https://www.youtube.com/user/username
    /youtube\.com\/user\/([^\/\?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Получаем информацию о канале по ID или username
async function getChannelInfo(identifier, originalUrl) {
  console.log('🔍 Ищем канал с идентификатором:', identifier);
  console.log('🔗 Оригинальная ссылка:', originalUrl);
  
  try {
    // Сначала пробуем как channel ID
    console.log('📡 Запрос 1: Поиск по channel ID...');
    let response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet',
        id: identifier,
        key: YOUTUBE_API_KEY
      }
    });

    console.log('📊 Ответ API (channel ID):', {
      items: response.data.items?.length || 0,
      status: response.status
    });

    if (response.data.items && response.data.items.length > 0) {
      console.log('✅ Канал найден по ID:', response.data.items[0].snippet.title);
      return response.data.items[0];
    }

    // Если не найден, пробуем как username (только для старых каналов)
    console.log('📡 Запрос 2: Поиск по username...');
    response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet',
        forUsername: identifier,
        key: YOUTUBE_API_KEY
      }
    });

    console.log('📊 Ответ API (username):', {
      items: response.data.items?.length || 0,
      status: response.status
    });

    if (response.data.items && response.data.items.length > 0) {
      console.log('✅ Канал найден по username:', response.data.items[0].snippet.title);
      return response.data.items[0];
    }

    // Для @username каналов используем более точный поиск
    if (identifier.startsWith('@') || originalUrl.includes('/@')) {
      console.log('📡 Запрос 3: Точный поиск @username канала...');
      
      // Убираем @ если есть
      const cleanUsername = identifier.startsWith('@') ? identifier.substring(1) : identifier;
      
      response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: `@${cleanUsername}`,
          type: 'channel',
          maxResults: 5,
          key: YOUTUBE_API_KEY
        }
      });

      console.log('📊 Ответ API (точный поиск @username):', {
        items: response.data.items?.length || 0,
        status: response.status
      });

      if (response.data.items && response.data.items.length > 0) {
        // Ищем точное совпадение
        const exactMatch = response.data.items.find(item => {
          const channelTitle = item.snippet.title.toLowerCase();
          const channelHandle = item.snippet.channelHandle?.toLowerCase() || '';
          const searchUsername = cleanUsername.toLowerCase();
          
          return channelTitle.includes(searchUsername) || 
                 channelHandle.includes(searchUsername) ||
                 channelHandle === `@${searchUsername}`;
        });

        if (exactMatch) {
          console.log('✅ Найдено точное совпадение:', exactMatch.snippet.title);
          
          // Получаем полную информацию о канале
          const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
              part: 'snippet',
              id: exactMatch.snippet.channelId,
              key: YOUTUBE_API_KEY
            }
          });

          if (channelResponse.data.items && channelResponse.data.items.length > 0) {
            console.log('✅ Получена полная информация о канале:', channelResponse.data.items[0].snippet.title);
            return channelResponse.data.items[0];
          }
        } else {
          console.log('⚠️ Точное совпадение не найдено, возвращаем первый результат');
          const firstResult = response.data.items[0];
          
          // Получаем полную информацию о канале
          const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
              part: 'snippet',
              id: firstResult.snippet.channelId,
              key: YOUTUBE_API_KEY
            }
          });

          if (channelResponse.data.items && channelResponse.data.items.length > 0) {
            console.log('✅ Получена информация о канале:', channelResponse.data.items[0].snippet.title);
            return channelResponse.data.items[0];
          }
        }
      }
    } else {
      // Для обычных каналов используем общий поиск
      console.log('📡 Запрос 3: Общий поиск через search API...');
      response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: identifier,
          type: 'channel',
          maxResults: 1,
          key: YOUTUBE_API_KEY
        }
      });

      console.log('📊 Ответ API (search):', {
        items: response.data.items?.length || 0,
        status: response.status
      });

      if (response.data.items && response.data.items.length > 0) {
        const searchResult = response.data.items[0];
        console.log('✅ Канал найден через search:', searchResult.snippet.title);
        
        // Теперь получаем полную информацию о канале
        const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: {
            part: 'snippet',
            id: searchResult.snippet.channelId,
            key: YOUTUBE_API_KEY
          }
        });

        if (channelResponse.data.items && channelResponse.data.items.length > 0) {
          console.log('✅ Получена полная информация о канале:', channelResponse.data.items[0].snippet.title);
          return channelResponse.data.items[0];
        }
      }
    }

    console.log('❌ Канал не найден');
    return null;
  } catch (error) {
    console.error('💥 Ошибка получения информации о канале:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return null;
  }
}

// Привязать YouTube канал по ссылке
exports.linkYoutubeByUrl = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    const userId = req.user.id;

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'Необходимо указать ссылку на YouTube канал' });
    }

    // Извлекаем ID канала из ссылки
    const channelId = exports.extractChannelId(youtubeUrl);
    
    if (!channelId) {
      return res.status(400).json({ error: 'Неверный формат ссылки на YouTube канал' });
    }

    // Получаем информацию о канале
    const channelInfo = await getChannelInfo(channelId, youtubeUrl);
    
    if (!channelInfo) {
      return res.status(404).json({ error: 'YouTube канал не найден' });
    }

    const { id: youtubeId, snippet } = channelInfo;
    const channelName = snippet.title;
    // Сохраняем оригинальную ссылку пользователя
    const channelUrl = youtubeUrl;

    // Сохраняем в профиль
    await User.update({
      youtubeId: youtubeId,
      youtubeUsername: channelName,
      youtubeUrl: channelUrl // Добавляем сохранение оригинальной ссылки
    }, { where: { id: userId } });

    res.json({ 
      success: true, 
      channelName, 
      channelUrl,
      message: 'YouTube канал успешно привязан!' 
    });

  } catch (error) {
    console.error('Ошибка привязки YouTube:', error);
    res.status(500).json({ error: 'Ошибка при привязке YouTube канала' });
  }
};

// Отвязать YouTube
exports.unlinkYoutube = async (req, res) => {
  try {
    await User.update({ 
      youtubeId: null, 
      youtubeUsername: null,
      youtubeUrl: null
    }, { where: { id: req.user.id } });
    
    res.json({ success: true, message: 'YouTube канал отвязан' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отвязке YouTube' });
  }
}; 