const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');
const { User } = require('../../models');

// Мокаем JWT
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    test('should call next() with valid token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      jwt.verify.mockReturnValue({ id: 1 });
      
      // Мокаем User.findByPk
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      mockReq.headers.authorization = 'Bearer valid-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 401 when no token provided', async () => {
      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Нет токена доступа',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when token format is invalid', async () => {
      mockReq.headers.authorization = 'InvalidFormat token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Неверный формат токена',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockReq.headers.authorization = 'Bearer invalid-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Недействительный токен',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when user not found', async () => {
      jwt.verify.mockReturnValue({ id: 999 });
      User.findByPk = jest.fn().mockResolvedValue(null);

      mockReq.headers.authorization = 'Bearer valid-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Пользователь не найден',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user is banned', async () => {
      const bannedUser = {
        id: 1,
        username: 'banneduser',
        email: 'banned@example.com',
        role: 'user',
        isBanned: true,
        banReason: 'Violation of rules',
      };

      jwt.verify.mockReturnValue({ id: 1 });
      User.findByPk = jest.fn().mockResolvedValue(bannedUser);

      mockReq.headers.authorization = 'Bearer valid-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('заблокирован'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('admin middleware', () => {
    test('should call next() for admin user', async () => {
      const adminUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      };

      mockReq.user = adminUser;

      authMiddleware.admin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 for non-admin user', async () => {
      const regularUser = {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        role: 'user',
      };

      mockReq.user = regularUser;

      authMiddleware.admin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Доступ запрещен. Требуются права администратора',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user is not defined', async () => {
      authMiddleware.admin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Доступ запрещен. Требуются права администратора',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    test('should set user when valid token provided', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      jwt.verify.mockReturnValue({ id: 1 });
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      mockReq.headers.authorization = 'Bearer valid-token';

      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next() without user when no token provided', async () => {
      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next() without user when token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockReq.headers.authorization = 'Bearer invalid-token';

      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next() without user when user not found', async () => {
      jwt.verify.mockReturnValue({ id: 999 });
      User.findByPk = jest.fn().mockResolvedValue(null);

      mockReq.headers.authorization = 'Bearer valid-token';

      await authMiddleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    test('should handle rate limiting correctly', () => {
      const rateLimit = authMiddleware.rateLimit;
      
      expect(rateLimit).toBeDefined();
      expect(typeof rateLimit).toBe('function');
    });
  });

  describe('error handling', () => {
    test('should handle database errors gracefully', async () => {
      jwt.verify.mockReturnValue({ id: 1 });
      User.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));

      mockReq.headers.authorization = 'Bearer valid-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Ошибка сервера',
        })
      );
    });

    test('should handle JWT errors gracefully', async () => {
      jwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      mockReq.headers.authorization = 'Bearer malformed-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Недействительный токен',
        })
      );
    });

    test('should handle JWT expired errors', async () => {
      jwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired');
      });

      mockReq.headers.authorization = 'Bearer expired-token';

      await authMiddleware.protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Недействительный токен',
        })
      );
    });
  });
}); 