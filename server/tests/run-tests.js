#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Запуск тестов для Sabotage Website Backend...\n');

// Цвета для вывода
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Проверяем наличие необходимых файлов
function checkRequiredFiles() {
  log('📋 Проверка необходимых файлов...', 'blue');
  
  const requiredFiles = [
    'package.json',
    'tests/setup.js',
    'tests/models/User.test.js',
    'tests/controllers/authController.test.js',
    'tests/controllers/youtubeController.test.js',
    'tests/middleware/authMiddleware.test.js',
    'tests/services/emailService.test.js',
    'tests/integration/api.test.js',
    'tests/utils/helpers.test.js',
  ];

  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, '..', file))) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    log('❌ Отсутствуют следующие файлы:', 'red');
    missingFiles.forEach(file => log(`   - ${file}`, 'red'));
    process.exit(1);
  }

  log('✅ Все необходимые файлы найдены', 'green');
}

// Запускаем тесты по категориям
async function runTests() {
  const testCategories = [
    {
      name: 'Модели',
      pattern: 'tests/models/**/*.test.js',
      description: 'Тестирование моделей данных'
    },
    {
      name: 'Контроллеры',
      pattern: 'tests/controllers/**/*.test.js',
      description: 'Тестирование API контроллеров'
    },
    {
      name: 'Middleware',
      pattern: 'tests/middleware/**/*.test.js',
      description: 'Тестирование промежуточного ПО'
    },
    {
      name: 'Сервисы',
      pattern: 'tests/services/**/*.test.js',
      description: 'Тестирование бизнес-логики'
    },
    {
      name: 'Утилиты',
      pattern: 'tests/utils/**/*.test.js',
      description: 'Тестирование вспомогательных функций'
    },
    {
      name: 'Интеграционные',
      pattern: 'tests/integration/**/*.test.js',
      description: 'Интеграционное тестирование API'
    }
  ];

  const results = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const category of testCategories) {
    log(`\n🔍 Запуск тестов: ${category.name}`, 'cyan');
    log(`   ${category.description}`, 'yellow');

    try {
      const startTime = Date.now();
      const result = execSync(`npx jest ${category.pattern} --silent --json`, {
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      const testResult = JSON.parse(result);
      const passed = testResult.numPassedTests;
      const failed = testResult.numFailedTests;
      const total = testResult.numTotalTests;

      totalTests += total;
      totalPassed += passed;
      totalFailed += failed;

      if (failed === 0) {
        log(`✅ ${category.name}: ${passed}/${total} тестов прошли (${duration}s)`, 'green');
      } else {
        log(`❌ ${category.name}: ${passed}/${total} тестов прошли, ${failed} упали (${duration}s)`, 'red');
      }

      results.push({
        category: category.name,
        passed,
        failed,
        total,
        duration,
        success: failed === 0
      });

    } catch (error) {
      log(`❌ Ошибка при запуске тестов ${category.name}:`, 'red');
      log(error.message, 'red');
      
      results.push({
        category: category.name,
        passed: 0,
        failed: 1,
        total: 1,
        duration: 0,
        success: false
      });
      
      totalFailed++;
    }
  }

  return { results, totalTests, totalPassed, totalFailed };
}

// Генерируем отчет
function generateReport(results, totalTests, totalPassed, totalFailed) {
  log('\n📊 ОТЧЕТ О ТЕСТИРОВАНИИ', 'bright');
  log('='.repeat(50), 'blue');

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    
    log(`${status} ${result.category}:`, color);
    log(`   Прошло: ${result.passed}/${result.total} (${((result.passed/result.total)*100).toFixed(1)}%)`);
    log(`   Время: ${result.duration}s`);
    log('');
  });

  log('ИТОГО:', 'bright');
  log(`   Всего тестов: ${totalTests}`, 'blue');
  log(`   Прошло: ${totalPassed}`, 'green');
  log(`   Упало: ${totalFailed}`, 'red');
  
  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  log(`   Успешность: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (totalFailed === 0) {
    log('\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!', 'green');
    return true;
  } else {
    log('\n⚠️  НЕКОТОРЫЕ ТЕСТЫ УПАЛИ', 'yellow');
    return false;
  }
}

// Проверяем покрытие кода
function checkCoverage() {
  log('\n📈 Проверка покрытия кода...', 'blue');
  
  try {
    execSync('npx jest --coverage --silent', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    // Читаем отчет о покрытии
    const coveragePath = path.join(__dirname, '..', 'coverage', 'lcov-report', 'index.html');
    if (fs.existsSync(coveragePath)) {
      log('✅ Отчет о покрытии сгенерирован', 'green');
      log(`   Файл: ${coveragePath}`, 'yellow');
    }
  } catch (error) {
    log('❌ Ошибка при генерации отчета о покрытии:', 'red');
    log(error.message, 'red');
  }
}

// Основная функция
async function main() {
  try {
    checkRequiredFiles();
    
    const { results, totalTests, totalPassed, totalFailed } = await runTests();
    const success = generateReport(results, totalTests, totalPassed, totalFailed);
    
    checkCoverage();
    
    if (!success) {
      log('\n💡 Рекомендации:', 'cyan');
      log('   - Проверьте логи ошибок выше', 'yellow');
      log('   - Убедитесь, что база данных доступна', 'yellow');
      log('   - Проверьте конфигурацию тестового окружения', 'yellow');
      log('   - Запустите тесты с флагом --verbose для подробного вывода', 'yellow');
    }

    process.exit(success ? 0 : 1);
  } catch (error) {
    log('💥 Критическая ошибка при запуске тестов:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Запускаем тесты
if (require.main === module) {
  main();
}

module.exports = { runTests, generateReport }; 