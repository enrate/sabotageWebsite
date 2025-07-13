const { User } = require('../../models');
const youtubeController = require('../../controllers/youtubeController');
const axios = require('axios');

// Мокаем axios
jest.mock('axios');

describe('YouTube Controller', () => {
  let testUser;

  beforeEach(async () => {
    // Очищаем базу данных перед каждым тестом
    await User.destroy({ where: {} });
    
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    });

    // Настраиваем моки axios
    axios.get.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractChannelId', () => {
    test('should extract channel ID from channel URL', () => {
      const url = 'https://www.youtube.com/channel/UC123456789';
      const channelId = youtubeController.extractChannelId(url);
      expect(channelId).toBe('UC123456789');
    });

    test('should extract username from @username URL', () => {
      const url = 'https://www.youtube.com/@testchannel';
      const channelId = youtubeController.extractChannelId(url);
      expect(channelId).toBe('testchannel');
    });

    test('should extract username from /c/ URL', () => {
      const url = 'https://www.youtube.com/c/TestChannel';
      const channelId = youtubeController.extractChannelId(url);
      expect(channelId).toBe('TestChannel');
    });

    test('should extract username from /user/ URL', () => {
      const url = 'https://www.youtube.com/user/testuser';
      const channelId = youtubeController.extractChannelId(url);
      expect(channelId).toBe('testuser');
    });

    test('should return null for invalid URL', () => {
      const url = 'https://www.youtube.com/invalid/format';
      const channelId = youtubeController.extractChannelId(url);
      expect(channelId).toBeNull();
    });

    test('should return null for non-YouTube URL', () => {
      const url = 'https://example.com/channel/123';
      const channelId = youtubeController.extractChannelId(url);
      expect(channelId).toBeNull();
    });
  });

  describe('linkYoutubeByUrl', () => {
    const mockChannelInfo = {
      id: 'UC123456789',
      snippet: {
        title: 'Test Channel',
        description: 'Test channel description',
      },
    };

    test('should link YouTube channel successfully', async () => {
      const youtubeUrl = 'https://www.youtube.com/@testchannel';
      
      // Мокаем успешный ответ от YouTube API
      axios.get.mockResolvedValueOnce({
        data: {
          items: [mockChannelInfo],
        },
      });

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          channelName: 'Test Channel',
          channelUrl: youtubeUrl,
          message: 'YouTube канал успешно привязан!',
        })
      );

      // Проверяем, что данные сохранены в базе
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.youtubeId).toBe('UC123456789');
      expect(updatedUser.youtubeUsername).toBe('Test Channel');
      expect(updatedUser.youtubeUrl).toBe(youtubeUrl);
    });

    test('should return error for missing YouTube URL', async () => {
      const req = {
        body: {},
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Необходимо указать ссылку на YouTube канал',
        })
      );
    });

    test('should return error for invalid YouTube URL format', async () => {
      const req = {
        body: { youtubeUrl: 'https://example.com/invalid' },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Неверный формат ссылки на YouTube канал',
        })
      );
    });

    test('should return error when channel not found', async () => {
      const youtubeUrl = 'https://www.youtube.com/@nonexistent';
      
      // Мокаем пустой ответ от YouTube API
      axios.get.mockResolvedValueOnce({
        data: { items: [] },
      });

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'YouTube канал не найден',
        })
      );
    });

    test('should handle YouTube API errors', async () => {
      const youtubeUrl = 'https://www.youtube.com/@testchannel';
      
      // Мокаем ошибку от YouTube API
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Ошибка при привязке YouTube канала',
        })
      );
    });

    test('should handle search fallback for @username channels', async () => {
      const youtubeUrl = 'https://www.youtube.com/@testchannel';
      
      // Мокаем пустой ответ для channel ID и username поиска
      axios.get
        .mockResolvedValueOnce({ data: { items: [] } }) // channel ID search
        .mockResolvedValueOnce({ data: { items: [] } }) // username search
        .mockResolvedValueOnce({ // search API
          data: {
            items: [{
              snippet: {
                title: 'Found Channel',
                channelId: 'UC123456789',
              },
            }],
          },
        })
        .mockResolvedValueOnce({ // get channel info
          data: {
            items: [mockChannelInfo],
          },
        });

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          channelName: 'Test Channel',
        })
      );
    });
  });

  describe('unlinkYoutube', () => {
    test('should unlink YouTube channel successfully', async () => {
      // Создаем пользователя с привязанным YouTube
      const userWithYoutube = await User.create({
        username: 'youtubeuser',
        email: 'youtube@example.com',
        password: 'password123',
        youtubeId: 'UC123456789',
        youtubeUsername: 'Test Channel',
        youtubeUrl: 'https://youtube.com/@testchannel',
      });

      const req = {
        user: { id: userWithYoutube.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.unlinkYoutube(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'YouTube канал отвязан',
        })
      );

      // Проверяем, что данные очищены в базе
      const updatedUser = await User.findByPk(userWithYoutube.id);
      expect(updatedUser.youtubeId).toBeNull();
      expect(updatedUser.youtubeUsername).toBeNull();
      expect(updatedUser.youtubeUrl).toBeNull();
    });

    test('should handle database errors during unlink', async () => {
      const req = {
        user: { id: 99999 }, // Несуществующий пользователь
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.unlinkYoutube(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Ошибка при отвязке YouTube',
        })
      );
    });
  });

  describe('YouTube API Integration', () => {
    test('should handle channel ID format correctly', async () => {
      const youtubeUrl = 'https://www.youtube.com/channel/UC123456789';
      
      axios.get.mockResolvedValueOnce({
        data: {
          items: [mockChannelInfo],
        },
      });

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/channels',
        expect.objectContaining({
          params: expect.objectContaining({
            id: 'UC123456789',
          }),
        })
      );
    });

    test('should handle username format correctly', async () => {
      const youtubeUrl = 'https://www.youtube.com/user/testuser';
      
      axios.get
        .mockResolvedValueOnce({ data: { items: [] } }) // channel ID search
        .mockResolvedValueOnce({ // username search
          data: {
            items: [mockChannelInfo],
          },
        });

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/channels',
        expect.objectContaining({
          params: expect.objectContaining({
            forUsername: 'testuser',
          }),
        })
      );
    });

    test('should handle @username format with search fallback', async () => {
      const youtubeUrl = 'https://www.youtube.com/@testchannel';
      
      axios.get
        .mockResolvedValueOnce({ data: { items: [] } }) // channel ID search
        .mockResolvedValueOnce({ data: { items: [] } }) // username search
        .mockResolvedValueOnce({ // search API
          data: {
            items: [{
              snippet: {
                title: 'Test Channel',
                channelId: 'UC123456789',
                channelHandle: '@testchannel',
              },
            }],
          },
        })
        .mockResolvedValueOnce({ // get channel info
          data: {
            items: [mockChannelInfo],
          },
        });

      const req = {
        body: { youtubeUrl },
        user: { id: testUser.id },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await youtubeController.linkYoutubeByUrl(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: '@testchannel',
            type: 'channel',
          }),
        })
      );
    });
  });
}); 