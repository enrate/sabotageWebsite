const request = require('supertest');
const app = require('../../index');
const { User, Squad, News } = require('../../models');

describe('API Integration Tests', () => {
  let testUser, testAdmin, testSquad, authToken, adminToken;

  beforeAll(async () => {
    // Очищаем базу данных
    await User.destroy({ where: {} });
    await Squad.destroy({ where: {} });
    await News.destroy({ where: {} });

    // Создаем тестовых пользователей
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    });

    testAdmin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });

    // Создаем тестовый отряд
    testSquad = await Squad.create({
      name: 'Test Squad',
      description: 'Test squad description',
      leaderId: testAdmin.id,
    });
  });

  afterAll(async () => {
    await User.destroy({ where: {} });
    await Squad.destroy({ where: {} });
    await News.destroy({ where: {} });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      test('should register a new user', async () => {
        const userData = {
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.user.username).toBe(userData.username);
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.token).toBeDefined();
      });

      test('should return error for duplicate username', async () => {
        const userData = {
          username: 'testuser', // Уже существует
          email: 'different@example.com',
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toContain('уже существует');
      });

      test('should return error for invalid email', async () => {
        const userData = {
          username: 'testuser2',
          email: 'invalid-email',
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toContain('email');
      });
    });

    describe('POST /api/auth/login', () => {
      test('should login user successfully', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.username).toBe('testuser');
        expect(response.body.token).toBeDefined();

        authToken = response.body.token;
      });

      test('should return error for invalid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.error).toContain('неверные');
      });
    });

    describe('POST /api/auth/login (admin)', () => {
      test('should login admin successfully', async () => {
        const loginData = {
          email: 'admin@example.com',
          password: 'password123',
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.role).toBe('admin');
        expect(response.body.token).toBeDefined();

        adminToken = response.body.token;
      });
    });
  });

  describe('User Endpoints', () => {
    describe('GET /api/users/:id', () => {
      test('should get user profile', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}`)
          .expect(200);

        expect(response.body.username).toBe('testuser');
        expect(response.body.email).toBe('test@example.com');
        expect(response.body.password).toBeUndefined(); // Пароль не должен возвращаться
      });

      test('should return 404 for non-existent user', async () => {
        await request(app)
          .get('/api/users/99999')
          .expect(404);
      });
    });

    describe('PUT /api/users/profile', () => {
      test('should update user profile', async () => {
        const updateData = {
          username: 'updateduser',
          description: 'Updated description',
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.username).toBe('updateduser');
        expect(response.body.description).toBe('Updated description');
      });

      test('should return 401 without token', async () => {
        const updateData = {
          username: 'updateduser',
        };

        await request(app)
          .put('/api/users/profile')
          .send(updateData)
          .expect(401);
      });
    });
  });

  describe('Squad Endpoints', () => {
    describe('GET /api/squads', () => {
      test('should get all squads', async () => {
        const response = await request(app)
          .get('/api/squads')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('description');
      });
    });

    describe('GET /api/squads/:id', () => {
      test('should get squad by id', async () => {
        const response = await request(app)
          .get(`/api/squads/${testSquad.id}`)
          .expect(200);

        expect(response.body.name).toBe('Test Squad');
        expect(response.body.description).toBe('Test squad description');
      });

      test('should return 404 for non-existent squad', async () => {
        await request(app)
          .get('/api/squads/99999')
          .expect(404);
      });
    });

    describe('POST /api/squads', () => {
      test('should create new squad', async () => {
        const squadData = {
          name: 'New Squad',
          description: 'New squad description',
        };

        const response = await request(app)
          .post('/api/squads')
          .set('Authorization', `Bearer ${authToken}`)
          .send(squadData)
          .expect(201);

        expect(response.body.name).toBe('New Squad');
        expect(response.body.description).toBe('New squad description');
        expect(response.body.leaderId).toBe(testUser.id);
      });

      test('should return 401 without token', async () => {
        const squadData = {
          name: 'New Squad',
          description: 'New squad description',
        };

        await request(app)
          .post('/api/squads')
          .send(squadData)
          .expect(401);
      });
    });
  });

  describe('News Endpoints', () => {
    let testNews;

    beforeAll(async () => {
      testNews = await News.create({
        title: 'Test News',
        content: 'Test news content',
        authorId: testAdmin.id,
      });
    });

    describe('GET /api/news', () => {
      test('should get all news', async () => {
        const response = await request(app)
          .get('/api/news')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('title');
        expect(response.body[0]).toHaveProperty('content');
      });
    });

    describe('GET /api/news/:id', () => {
      test('should get news by id', async () => {
        const response = await request(app)
          .get(`/api/news/${testNews.id}`)
          .expect(200);

        expect(response.body.title).toBe('Test News');
        expect(response.body.content).toBe('Test news content');
      });

      test('should return 404 for non-existent news', async () => {
        await request(app)
          .get('/api/news/99999')
          .expect(404);
      });
    });

    describe('POST /api/news', () => {
      test('should create news (admin only)', async () => {
        const newsData = {
          title: 'New News',
          content: 'New news content',
        };

        const response = await request(app)
          .post('/api/news')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newsData)
          .expect(201);

        expect(response.body.title).toBe('New News');
        expect(response.body.content).toBe('New news content');
        expect(response.body.authorId).toBe(testAdmin.id);
      });

      test('should return 403 for non-admin user', async () => {
        const newsData = {
          title: 'New News',
          content: 'New news content',
        };

        await request(app)
          .post('/api/news')
          .set('Authorization', `Bearer ${authToken}`)
          .send(newsData)
          .expect(403);
      });
    });
  });

  describe('YouTube Integration', () => {
    describe('POST /api/youtube/link', () => {
      test('should link YouTube channel', async () => {
        const youtubeData = {
          youtubeUrl: 'https://www.youtube.com/@testchannel',
        };

        const response = await request(app)
          .post('/api/youtube/link')
          .set('Authorization', `Bearer ${authToken}`)
          .send(youtubeData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.channelName).toBeDefined();
        expect(response.body.channelUrl).toBe(youtubeData.youtubeUrl);
      });

      test('should return error for invalid URL', async () => {
        const youtubeData = {
          youtubeUrl: 'https://example.com/invalid',
        };

        const response = await request(app)
          .post('/api/youtube/link')
          .set('Authorization', `Bearer ${authToken}`)
          .send(youtubeData)
          .expect(400);

        expect(response.body.error).toContain('формат');
      });

      test('should return 401 without token', async () => {
        const youtubeData = {
          youtubeUrl: 'https://www.youtube.com/@testchannel',
        };

        await request(app)
          .post('/api/youtube/link')
          .send(youtubeData)
          .expect(401);
      });
    });

    describe('POST /api/youtube/unlink', () => {
      test('should unlink YouTube channel', async () => {
        const response = await request(app)
          .post('/api/youtube/unlink')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('отвязан');
      });

      test('should return 401 without token', async () => {
        await request(app)
          .post('/api/youtube/unlink')
          .expect(401);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/users', () => {
      test('should get all users (admin only)', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('username');
        expect(response.body[0]).toHaveProperty('email');
      });

      test('should return 403 for non-admin user', async () => {
        await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/admin/users/:id/ban', () => {
      test('should ban user (admin only)', async () => {
        const banData = {
          isBanned: true,
          banReason: 'Test ban',
        };

        const response = await request(app)
          .put(`/api/admin/users/${testUser.id}/ban`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(banData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.isBanned).toBe(true);
        expect(response.body.user.banReason).toBe('Test ban');
      });

      test('should return 403 for non-admin user', async () => {
        const banData = {
          isBanned: true,
          banReason: 'Test ban',
        };

        await request(app)
          .put(`/api/admin/users/${testUser.id}/ban`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(banData)
          .expect(403);
      });
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    test('should handle large payloads', async () => {
      const largeData = {
        content: 'a'.repeat(10000), // Очень большой контент
      };

      await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeData)
        .expect(413); // Payload Too Large
    });
  });

  describe('Rate Limiting', () => {
    test('should limit repeated requests', async () => {
      // Делаем много запросов подряд
      const promises = Array(100).fill().map(() =>
        request(app).get('/api/squads')
      );

      const responses = await Promise.all(promises);
      
      // Проверяем, что не все запросы прошли успешно
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });
}); 