const nodemailer = require('nodemailer');
const emailService = require('../../services/emailService');

// Мокаем nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
  let mockTransporter;

  beforeEach(() => {
    mockTransporter = {
      sendMail: jest.fn(),
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    test('should send verification email successfully', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = 'verification-token';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'mock-message-id',
      });

      const result = await emailService.sendVerificationEmail(user, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: user.email,
          subject: expect.stringContaining('подтверждение'),
          html: expect.stringContaining(token),
        })
      );
      expect(result).toBe(true);
    });

    test('should handle email sending errors', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = 'verification-token';

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendVerificationEmail(user, token);

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    test('should send password reset email successfully', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = 'reset-token';

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'mock-message-id',
      });

      const result = await emailService.sendPasswordResetEmail(user, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: user.email,
          subject: expect.stringContaining('сброс'),
          html: expect.stringContaining(token),
        })
      );
      expect(result).toBe(true);
    });

    test('should handle email sending errors', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = 'reset-token';

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendPasswordResetEmail(user, token);

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    test('should send welcome email successfully', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'mock-message-id',
      });

      const result = await emailService.sendWelcomeEmail(user);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: user.email,
          subject: expect.stringContaining('добро пожаловать'),
          html: expect.stringContaining(user.username),
        })
      );
      expect(result).toBe(true);
    });

    test('should handle email sending errors', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendWelcomeEmail(user);

      expect(result).toBe(false);
    });
  });

  describe('sendNotificationEmail', () => {
    test('should send notification email successfully', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const notification = {
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'mock-message-id',
      });

      const result = await emailService.sendNotificationEmail(user, notification);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
          to: user.email,
          subject: expect.stringContaining(notification.title),
          html: expect.stringContaining(notification.message),
        })
      );
      expect(result).toBe(true);
    });

    test('should handle email sending errors', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const notification = {
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const result = await emailService.sendNotificationEmail(user, notification);

      expect(result).toBe(false);
    });
  });

  describe('email template generation', () => {
    test('should generate verification email template', () => {
      const user = {
        username: 'testuser',
      };
      const token = 'verification-token';
      const baseUrl = 'https://example.com';

      const template = emailService.generateVerificationTemplate(user, token, baseUrl);

      expect(template).toContain(user.username);
      expect(template).toContain(token);
      expect(template).toContain(baseUrl);
      expect(template).toContain('подтвердить');
    });

    test('should generate password reset email template', () => {
      const user = {
        username: 'testuser',
      };
      const token = 'reset-token';
      const baseUrl = 'https://example.com';

      const template = emailService.generatePasswordResetTemplate(user, token, baseUrl);

      expect(template).toContain(user.username);
      expect(template).toContain(token);
      expect(template).toContain(baseUrl);
      expect(template).toContain('сбросить');
    });

    test('should generate welcome email template', () => {
      const user = {
        username: 'testuser',
      };

      const template = emailService.generateWelcomeTemplate(user);

      expect(template).toContain(user.username);
      expect(template).toContain('добро пожаловать');
    });

    test('should generate notification email template', () => {
      const user = {
        username: 'testuser',
      };
      const notification = {
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      const template = emailService.generateNotificationTemplate(user, notification);

      expect(template).toContain(user.username);
      expect(template).toContain(notification.title);
      expect(template).toContain(notification.message);
    });
  });

  describe('email configuration', () => {
    test('should use correct email configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: expect.any(String),
          port: expect.any(Number),
          secure: expect.any(Boolean),
          auth: expect.objectContaining({
            user: expect.any(String),
            pass: expect.any(String),
          }),
        })
      );
    });

    test('should handle missing email configuration', () => {
      // Сбрасываем мок
      nodemailer.createTransport.mockReset();
      nodemailer.createTransport.mockReturnValue(mockTransporter);

      // Проверяем, что сервис не падает при отсутствии конфигурации
      expect(() => {
        emailService.sendVerificationEmail({ email: 'test@example.com' }, 'token');
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    test('should handle transporter creation errors', async () => {
      nodemailer.createTransport.mockImplementation(() => {
        throw new Error('Transporter creation failed');
      });

      const result = await emailService.sendVerificationEmail(
        { email: 'test@example.com' },
        'token'
      );

      expect(result).toBe(false);
    });

    test('should handle invalid email addresses', async () => {
      const user = {
        email: 'invalid-email',
        username: 'testuser',
      };
      const token = 'verification-token';

      mockTransporter.sendMail.mockRejectedValue(new Error('Invalid email'));

      const result = await emailService.sendVerificationEmail(user, token);

      expect(result).toBe(false);
    });

    test('should handle network errors', async () => {
      const user = {
        email: 'test@example.com',
        username: 'testuser',
      };
      const token = 'verification-token';

      mockTransporter.sendMail.mockRejectedValue(new Error('Network timeout'));

      const result = await emailService.sendVerificationEmail(user, token);

      expect(result).toBe(false);
    });
  });
}); 