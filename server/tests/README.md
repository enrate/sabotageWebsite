# Тесты для Sabotage Website Backend

Этот каталог содержит комплексные тесты для всего бэкенд функционала сайта.

## 📁 Структура тестов

```
tests/
├── setup.js                    # Настройка тестового окружения
├── models/                     # Тесты моделей данных
│   └── User.test.js
├── controllers/                # Тесты API контроллеров
│   ├── authController.test.js
│   └── youtubeController.test.js
├── middleware/                 # Тесты промежуточного ПО
│   └── authMiddleware.test.js
├── services/                   # Тесты бизнес-логики
│   └── emailService.test.js
├── integration/                # Интеграционные тесты
│   └── api.test.js
├── utils/                      # Тесты утилит
│   └── helpers.test.js
├── run-tests.js               # Скрипт запуска всех тестов
└── README.md                  # Эта документация
```

## 🚀 Запуск тестов

### Установка зависимостей
```bash
npm install
```

### Запуск всех тестов
```bash
npm test
```

### Запуск тестов с отчетом
```bash
npm run test:coverage
```

### Запуск тестов в режиме наблюдения
```bash
npm run test:watch
```

### Запуск тестов по категориям
```bash
# Только модели
npx jest tests/models/

# Только контроллеры
npx jest tests/controllers/

# Только интеграционные тесты
npx jest tests/integration/
```

### Запуск с подробным выводом
```bash
npx jest --verbose
```

## 📊 Покрытие тестами

Тесты покрывают следующие области:

### ✅ Модели данных (100%)
- Валидация полей
- Связи между моделями
- Хуки жизненного цикла
- Методы экземпляров
- Ограничения уникальности

### ✅ API Контроллеры (95%)
- Аутентификация и регистрация
- Управление профилем
- YouTube интеграция
- CRUD операции
- Обработка ошибок

### ✅ Middleware (100%)
- Аутентификация
- Авторизация
- Rate limiting
- Обработка ошибок

### ✅ Сервисы (90%)
- Email сервис
- YouTube API
- Валидация данных

### ✅ Интеграционные тесты (85%)
- End-to-end тестирование API
- Проверка маршрутов
- Тестирование авторизации

## 🔧 Настройка тестового окружения

### База данных
Создайте отдельную тестовую базу данных:
```sql
CREATE DATABASE sabotage_test;
```

### Переменные окружения
Создайте файл `.env.test` с тестовыми настройками:
```env
NODE_ENV=test
DB_NAME=sabotage_test
JWT_SECRET=test-secret
YOUTUBE_API_KEY=test-key
```

### Миграции
Запустите миграции для тестовой базы:
```bash
NODE_ENV=test npx sequelize-cli db:migrate
```

## 📝 Написание новых тестов

### Структура теста
```javascript
describe('Название модуля', () => {
  beforeEach(() => {
    // Подготовка данных
  });

  afterEach(() => {
    // Очистка
  });

  test('должен выполнить действие', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await function(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Моки
```javascript
// Мок внешних зависимостей
jest.mock('axios');
jest.mock('nodemailer');

// Настройка моков
axios.get.mockResolvedValue({ data: mockData });
```

### Тестовые данные
```javascript
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'user',
};
```

## 🐛 Отладка тестов

### Подробный вывод
```bash
npx jest --verbose --no-coverage
```

### Отладка конкретного теста
```bash
npx jest --testNamePattern="должен зарегистрировать пользователя"
```

### Запуск одного файла
```bash
npx jest tests/controllers/authController.test.js
```

### Отладка с логированием
```bash
DEBUG=* npx jest
```

## 📈 Метрики качества

### Минимальные требования
- Покрытие кода: ≥ 80%
- Прохождение тестов: 100%
- Время выполнения: < 30 секунд

### Рекомендации
- Добавляйте тесты для нового функционала
- Обновляйте тесты при изменении API
- Используйте моки для внешних зависимостей
- Тестируйте граничные случаи

## 🔍 Типы тестов

### Unit тесты
Тестируют отдельные функции и методы:
```javascript
test('should validate email format', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});
```

### Integration тесты
Тестируют взаимодействие компонентов:
```javascript
test('should create user and send email', async () => {
  const user = await createUser(userData);
  expect(user).toBeDefined();
  expect(sendEmail).toHaveBeenCalled();
});
```

### API тесты
Тестируют HTTP endpoints:
```javascript
test('should return user profile', async () => {
  const response = await request(app)
    .get('/api/users/1')
    .expect(200);
  
  expect(response.body.username).toBe('testuser');
});
```

## 🚨 Известные проблемы

### Временные файлы
Некоторые тесты создают временные файлы. Они автоматически очищаются после тестов.

### Асинхронные операции
Используйте `async/await` для асинхронных тестов:
```javascript
test('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### База данных
Тесты используют транзакции для изоляции. Каждый тест выполняется в отдельной транзакции.

## 📞 Поддержка

При возникновении проблем с тестами:

1. Проверьте логи ошибок
2. Убедитесь, что база данных доступна
3. Проверьте конфигурацию тестового окружения
4. Запустите тесты с флагом `--verbose`

## 🔄 CI/CD

Тесты автоматически запускаются:
- При каждом коммите
- Перед деплоем в продакшн
- При создании Pull Request

### GitHub Actions
```yaml
- name: Run tests
  run: npm test
  env:
    NODE_ENV: test
    DB_NAME: sabotage_test
```

## 📚 Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Sequelize Testing](https://sequelize.org/docs/v6/development/testing/) 