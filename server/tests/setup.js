require('dotenv').config({ path: '.env.test' });

// Мокаем console.log для чистого вывода тестов
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Отключаем логи в тестах
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Восстанавливаем логи
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Глобальные моки
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Мок для JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ id: 1, username: 'testuser' })),
}));

// Мок для bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'hashed-password'),
  compare: jest.fn(() => true),
  genSalt: jest.fn(() => 'salt'),
}));

// Мок для nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'mock-message-id' })),
  })),
}));

// Мок для axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Мок для multer
jest.mock('multer', () => {
  const multer = () => {
    return {
      single: () => (req, res, next) => next(),
      array: () => (req, res, next) => next(),
    };
  };
  multer.memoryStorage = () => ({});
  return multer;
});

// Мок для socket.io
jest.mock('socket.io', () => {
  return jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
  }));
});

// Глобальные тестовые данные
global.testData = {
  users: {
    admin: {
      id: 1,
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    },
    user: {
      id: 2,
      username: 'testuser',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
    },
  },
  squads: {
    test: {
      id: 1,
      name: 'Test Squad',
      description: 'Test squad description',
      leaderId: 1,
    },
  },
  news: {
    test: {
      id: 1,
      title: 'Test News',
      content: 'Test news content',
      authorId: 1,
    },
  },
}; 