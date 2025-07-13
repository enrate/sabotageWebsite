const request = require('supertest');
const { User } = require('../../models');
const authController = require('../../controllers/authController');

// Мокаем JWT
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');

// Мокаем bcrypt
const bcrypt = require('bcryptjs');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  let testUser;

  beforeEach(async () => {
    // Очищаем базу данных перед каждым тестом
    await User.destroy({ where: {} });
    
    testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    };

    // Настраиваем моки
    jwt.sign.mockReturnValue('mock-jwt-token');
    bcrypt.hash.mockResolvedValue('hashed-password');
    bcrypt.compare.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const req = {
        body: userData,
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Пользователь успешно зарегистрирован',
          user: expect.objectContaining({
            username: userData.username,
            email: userData.email,
          }),
          token: 'mock-jwt-token',
        })
      );
    });

    test('should return error for duplicate username', async () => {
      // Создаем пользователя
      await User.create(testUser);

      const req = {
        body: {
          username: testUser.username,
          email: 'different@example.com',
          password: 'password123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('уже существует'),
        })
      );
    });

    test('should return error for duplicate email', async () => {
      // Создаем пользователя
      await User.create(testUser);

      const req = {
        body: {
          username: 'differentuser',
          email: testUser.email,
          password: 'password123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('уже существует'),
        })
      );
    });

    test('should return error for invalid email format', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('email'),
        })
      );
    });

    test('should return error for short password', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('пароль'),
        })
      );
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Создаем пользователя для тестов входа
      await User.create(testUser);
    });

    test('should login user successfully', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: testUser.password,
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Вход выполнен успешно',
          user: expect.objectContaining({
            username: testUser.username,
            email: testUser.email,
          }),
          token: 'mock-jwt-token',
        })
      );
    });

    test('should return error for non-existent user', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('неверные'),
        })
      );
    });

    test('should return error for wrong password', async () => {
      // Мокаем неправильный пароль
      bcrypt.compare.mockResolvedValue(false);

      const req = {
        body: {
          email: testUser.email,
          password: 'wrongpassword',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('неверные'),
        })
      );
    });

    test('should return error for banned user', async () => {
      // Создаем забаненного пользователя
      const bannedUser = await User.create({
        ...testUser,
        username: 'banneduser',
        email: 'banned@example.com',
        isBanned: true,
        banReason: 'Violation of rules',
      });

      const req = {
        body: {
          email: bannedUser.email,
          password: testUser.password,
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('заблокирован'),
        })
      );
    });
  });

  describe('POST /verify-email', () => {
    test('should verify email successfully', async () => {
      const user = await User.create({
        ...testUser,
        emailVerified: false,
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      const req = {
        body: {
          token: 'valid-token',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('подтвержден'),
        })
      );
    });

    test('should return error for invalid token', async () => {
      const req = {
        body: {
          token: 'invalid-token',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('недействителен'),
        })
      );
    });

    test('should return error for expired token', async () => {
      const user = await User.create({
        ...testUser,
        emailVerified: false,
        emailVerificationToken: 'expired-token',
        emailVerificationExpires: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      const req = {
        body: {
          token: 'expired-token',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('истек'),
        })
      );
    });
  });

  describe('POST /forgot-password', () => {
    test('should send reset email for existing user', async () => {
      await User.create(testUser);

      const req = {
        body: {
          email: testUser.email,
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('отправлено'),
        })
      );
    });

    test('should return success even for non-existent user (security)', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('отправлено'),
        })
      );
    });
  });

  describe('POST /reset-password', () => {
    test('should reset password successfully', async () => {
      const user = await User.create({
        ...testUser,
        emailVerificationToken: 'valid-reset-token',
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const req = {
        body: {
          token: 'valid-reset-token',
          password: 'newpassword123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('изменен'),
        })
      );
    });

    test('should return error for invalid reset token', async () => {
      const req = {
        body: {
          token: 'invalid-reset-token',
          password: 'newpassword123',
        },
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('недействителен'),
        })
      );
    });
  });
}); 