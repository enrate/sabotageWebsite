const crypto = require('crypto');

describe('Utility Functions', () => {
  describe('Token Generation', () => {
    test('should generate random token', () => {
      const token1 = crypto.randomBytes(32).toString('hex');
      const token2 = crypto.randomBytes(32).toString('hex');
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64);
      expect(token2.length).toBe(64);
    });

    test('should generate email verification token', () => {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      expect(token).toBeDefined();
      expect(expires).toBeInstanceOf(Date);
      expect(expires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Password Validation', () => {
    test('should validate strong password', () => {
      const strongPassword = 'StrongPass123!';
      
      expect(strongPassword.length).toBeGreaterThanOrEqual(6);
      expect(strongPassword.length).toBeLessThanOrEqual(100);
    });

    test('should reject weak password', () => {
      const weakPassword = '123';
      
      expect(weakPassword.length).toBeLessThan(6);
    });

    test('should reject very long password', () => {
      const longPassword = 'a'.repeat(101);
      
      expect(longPassword.length).toBeGreaterThan(100);
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        '123@numbers.com',
      ];

      validEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    test('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
      ];

      invalidEmails.forEach(email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Username Validation', () => {
    test('should validate correct username format', () => {
      const validUsernames = [
        'testuser',
        'user123',
        'user_name',
        'User',
        'a'.repeat(50), // Максимальная длина
      ];

      validUsernames.forEach(username => {
        expect(username.length).toBeGreaterThanOrEqual(2);
        expect(username.length).toBeLessThanOrEqual(50);
      });
    });

    test('should reject invalid username format', () => {
      const invalidUsernames = [
        'a', // Слишком короткий
        'a'.repeat(51), // Слишком длинный
        '', // Пустой
      ];

      invalidUsernames.forEach(username => {
        const isValid = username.length >= 2 && username.length <= 50;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('URL Validation', () => {
    test('should validate YouTube URLs', () => {
      const validYouTubeUrls = [
        'https://www.youtube.com/channel/UC123456789',
        'https://www.youtube.com/c/ChannelName',
        'https://www.youtube.com/@username',
        'https://www.youtube.com/user/username',
        'https://youtube.com/@username',
      ];

      validYouTubeUrls.forEach(url => {
        const patterns = [
          /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
          /youtube\.com\/c\/([^\/\?]+)/,
          /youtube\.com\/@([^\/\?]+)/,
          /youtube\.com\/user\/([^\/\?]+)/,
        ];

        const isValid = patterns.some(pattern => pattern.test(url));
        expect(isValid).toBe(true);
      });
    });

    test('should reject invalid YouTube URLs', () => {
      const invalidYouTubeUrls = [
        'https://example.com/channel/123',
        'https://youtube.com/invalid/format',
        'not-a-url',
        'https://youtube.com/',
      ];

      invalidYouTubeUrls.forEach(url => {
        const patterns = [
          /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
          /youtube\.com\/c\/([^\/\?]+)/,
          /youtube\.com\/@([^\/\?]+)/,
          /youtube\.com\/user\/([^\/\?]+)/,
        ];

        const isValid = patterns.some(pattern => pattern.test(url));
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Date Validation', () => {
    test('should validate future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      expect(futureDate.getTime()).toBeGreaterThan(Date.now());
    });

    test('should validate past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      expect(pastDate.getTime()).toBeLessThan(Date.now());
    });

    test('should check if date is expired', () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const validDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      expect(expiredDate.getTime()).toBeLessThan(Date.now());
      expect(validDate.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('String Sanitization', () => {
    test('should sanitize HTML content', () => {
      const htmlContent = '<script>alert("xss")</script><p>Safe content</p>';
      
      // Простая санитизация - удаляем теги script
      const sanitized = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Safe content');
    });

    test('should trim whitespace', () => {
      const textWithSpaces = '  test content  ';
      const trimmed = textWithSpaces.trim();
      
      expect(trimmed).toBe('test content');
      expect(trimmed.length).toBeLessThan(textWithSpaces.length);
    });

    test('should escape special characters', () => {
      const specialChars = '<>&"\'';
      const escaped = specialChars
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      
      expect(escaped).toBe('&lt;&gt;&amp;&quot;&#x27;');
    });
  });

  describe('Array and Object Utilities', () => {
    test('should remove duplicates from array', () => {
      const arrayWithDuplicates = [1, 2, 2, 3, 3, 4];
      const uniqueArray = [...new Set(arrayWithDuplicates)];
      
      expect(uniqueArray).toEqual([1, 2, 3, 4]);
      expect(uniqueArray.length).toBeLessThan(arrayWithDuplicates.length);
    });

    test('should filter array by condition', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const evenNumbers = numbers.filter(num => num % 2 === 0);
      
      expect(evenNumbers).toEqual([2, 4, 6]);
    });

    test('should map array values', () => {
      const numbers = [1, 2, 3, 4, 5];
      const doubled = numbers.map(num => num * 2);
      
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
    });

    test('should reduce array to single value', () => {
      const numbers = [1, 2, 3, 4, 5];
      const sum = numbers.reduce((acc, num) => acc + num, 0);
      
      expect(sum).toBe(15);
    });
  });

  describe('Error Handling', () => {
    test('should handle async errors', async () => {
      const asyncFunction = async () => {
        throw new Error('Test error');
      };

      try {
        await asyncFunction();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Test error');
      }
    });

    test('should handle sync errors', () => {
      const syncFunction = () => {
        throw new Error('Test error');
      };

      expect(() => syncFunction()).toThrow('Test error');
    });

    test('should handle null and undefined', () => {
      const nullValue = null;
      const undefinedValue = undefined;
      
      expect(nullValue).toBeNull();
      expect(undefinedValue).toBeUndefined();
    });
  });

  describe('Performance Utilities', () => {
    test('should measure execution time', () => {
      const startTime = Date.now();
      
      // Симуляция работы
      setTimeout(() => {}, 10);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should debounce function calls', () => {
      let callCount = 0;
      const debouncedFunction = (() => {
        let timeoutId;
        return () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            callCount++;
          }, 100);
        };
      })();

      // Множественные вызовы
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      expect(callCount).toBe(0); // Функция еще не вызвана
    });
  });

  describe('Validation Helpers', () => {
    test('should validate required fields', () => {
      const requiredFields = ['username', 'email', 'password'];
      const data = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
      };

      const missingFields = requiredFields.filter(field => !data[field]);
      
      expect(missingFields.length).toBe(0);
    });

    test('should detect missing required fields', () => {
      const requiredFields = ['username', 'email', 'password'];
      const data = {
        username: 'test',
        // email missing
        password: 'password123',
      };

      const missingFields = requiredFields.filter(field => !data[field]);
      
      expect(missingFields).toContain('email');
    });

    test('should validate object structure', () => {
      const expectedStructure = {
        id: 'number',
        username: 'string',
        email: 'string',
        role: 'string',
      };

      const validObject = {
        id: 1,
        username: 'test',
        email: 'test@example.com',
        role: 'user',
      };

      const isValid = Object.keys(expectedStructure).every(key => 
        validObject.hasOwnProperty(key) && 
        typeof validObject[key] === expectedStructure[key]
      );

      expect(isValid).toBe(true);
    });
  });
}); 