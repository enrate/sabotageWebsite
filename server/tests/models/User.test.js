const { User } = require('../../models');

describe('User Model', () => {
  let testUser;

  beforeEach(() => {
    testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    };
  });

  describe('Validation', () => {
    test('should create a valid user', async () => {
      const user = await User.create(testUser);
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
      expect(user.role).toBe(testUser.role);
    });

    test('should require username', async () => {
      const userWithoutUsername = { ...testUser };
      delete userWithoutUsername.username;
      
      await expect(User.create(userWithoutUsername)).rejects.toThrow();
    });

    test('should require email', async () => {
      const userWithoutEmail = { ...testUser };
      delete userWithoutEmail.email;
      
      await expect(User.create(userWithoutEmail)).rejects.toThrow();
    });

    test('should require password', async () => {
      const userWithoutPassword = { ...testUser };
      delete userWithoutPassword.password;
      
      await expect(User.create(userWithoutPassword)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userWithInvalidEmail = { ...testUser, email: 'invalid-email' };
      
      await expect(User.create(userWithInvalidEmail)).rejects.toThrow();
    });

    test('should enforce username length', async () => {
      const userWithShortUsername = { ...testUser, username: 'a' };
      const userWithLongUsername = { ...testUser, username: 'a'.repeat(51) };
      
      await expect(User.create(userWithShortUsername)).rejects.toThrow();
      await expect(User.create(userWithLongUsername)).rejects.toThrow();
    });

    test('should enforce password length', async () => {
      const userWithShortPassword = { ...testUser, password: '12345' };
      const userWithLongPassword = { ...testUser, password: 'a'.repeat(101) };
      
      await expect(User.create(userWithShortPassword)).rejects.toThrow();
      await expect(User.create(userWithLongPassword)).rejects.toThrow();
    });

    test('should enforce unique username', async () => {
      await User.create(testUser);
      
      const duplicateUser = { ...testUser, email: 'different@example.com' };
      await expect(User.create(duplicateUser)).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      await User.create(testUser);
      
      const duplicateUser = { ...testUser, username: 'differentuser' };
      await expect(User.create(duplicateUser)).rejects.toThrow();
    });
  });

  describe('Role Validation', () => {
    test('should accept valid roles', async () => {
      const validRoles = ['user', 'admin', 'member', 'deputy'];
      
      for (const role of validRoles) {
        const userWithRole = { ...testUser, role };
        const user = await User.create(userWithRole);
        expect(user.role).toBe(role);
      }
    });

    test('should reject invalid roles', async () => {
      const userWithInvalidRole = { ...testUser, role: 'invalid-role' };
      
      await expect(User.create(userWithInvalidRole)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before save', async () => {
      const user = await User.create(testUser);
      expect(user.password).not.toBe(testUser.password);
      expect(user.password).toContain('$2a$'); // bcrypt hash format
    });

    test('should not rehash password if unchanged', async () => {
      const user = await User.create(testUser);
      const originalHash = user.password;
      
      await user.update({ username: 'newusername' });
      expect(user.password).toBe(originalHash);
    });
  });

  describe('Instance Methods', () => {
    test('should match password correctly', async () => {
      const user = await User.create(testUser);
      const isMatch = await user.matchPassword(testUser.password);
      expect(isMatch).toBe(true);
    });

    test('should not match incorrect password', async () => {
      const user = await User.create(testUser);
      const isMatch = await user.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    test('should exclude password from JSON', () => {
      const user = User.build(testUser);
      const userJson = user.toJSON();
      expect(userJson.password).toBeUndefined();
    });
  });

  describe('Associations', () => {
    test('should have news association', () => {
      expect(User.associations.news).toBeDefined();
    });

    test('should have squad association', () => {
      expect(User.associations.squad).toBeDefined();
    });

    test('should have ledSquads association', () => {
      expect(User.associations.ledSquads).toBeDefined();
    });

    test('should have sentMessages association', () => {
      expect(User.associations.sentMessages).toBeDefined();
    });

    test('should have receivedMessages association', () => {
      expect(User.associations.receivedMessages).toBeDefined();
    });

    test('should have warnings association', () => {
      expect(User.associations.warnings).toBeDefined();
    });
  });

  describe('Social Media Fields', () => {
    test('should accept discord fields', async () => {
      const userWithDiscord = {
        ...testUser,
        discordId: '123456789',
        discordUsername: 'testuser#1234',
      };
      
      const user = await User.create(userWithDiscord);
      expect(user.discordId).toBe('123456789');
      expect(user.discordUsername).toBe('testuser#1234');
    });

    test('should accept twitch fields', async () => {
      const userWithTwitch = {
        ...testUser,
        twitchId: '987654321',
        twitchUsername: 'teststreamer',
      };
      
      const user = await User.create(userWithTwitch);
      expect(user.twitchId).toBe('987654321');
      expect(user.twitchUsername).toBe('teststreamer');
    });

    test('should accept youtube fields', async () => {
      const userWithYoutube = {
        ...testUser,
        youtubeId: 'UC123456789',
        youtubeUsername: 'testchannel',
        youtubeUrl: 'https://youtube.com/@testchannel',
      };
      
      const user = await User.create(userWithYoutube);
      expect(user.youtubeId).toBe('UC123456789');
      expect(user.youtubeUsername).toBe('testchannel');
      expect(user.youtubeUrl).toBe('https://youtube.com/@testchannel');
    });
  });

  describe('Stats Fields', () => {
    test('should have default stats values', async () => {
      const user = await User.create(testUser);
      expect(user.elo).toBe(1000);
      expect(user.kills).toBe(0);
      expect(user.deaths).toBe(0);
      expect(user.teamkills).toBe(0);
      expect(user.winrate).toBe(0);
      expect(user.matches).toBe(0);
    });

    test('should accept custom stats values', async () => {
      const userWithStats = {
        ...testUser,
        elo: 1500,
        kills: 100,
        deaths: 50,
        teamkills: 5,
        winrate: 75.5,
        matches: 20,
      };
      
      const user = await User.create(userWithStats);
      expect(user.elo).toBe(1500);
      expect(user.kills).toBe(100);
      expect(user.deaths).toBe(50);
      expect(user.teamkills).toBe(5);
      expect(user.winrate).toBe(75.5);
      expect(user.matches).toBe(20);
    });
  });

  describe('Ban Fields', () => {
    test('should have default ban values', async () => {
      const user = await User.create(testUser);
      expect(user.isBanned).toBe(false);
      expect(user.banReason).toBeNull();
    });

    test('should accept ban values', async () => {
      const bannedUser = {
        ...testUser,
        isBanned: true,
        banReason: 'Violation of rules',
      };
      
      const user = await User.create(bannedUser);
      expect(user.isBanned).toBe(true);
      expect(user.banReason).toBe('Violation of rules');
    });
  });

  describe('Email Verification', () => {
    test('should have default email verification values', async () => {
      const user = await User.create(testUser);
      expect(user.emailVerified).toBe(false);
      expect(user.emailVerificationToken).toBeNull();
      expect(user.emailVerificationExpires).toBeNull();
    });

    test('should accept email verification values', async () => {
      const verifiedUser = {
        ...testUser,
        emailVerified: true,
        emailVerificationToken: 'token123',
        emailVerificationExpires: new Date(),
      };
      
      const user = await User.create(verifiedUser);
      expect(user.emailVerified).toBe(true);
      expect(user.emailVerificationToken).toBe('token123');
      expect(user.emailVerificationExpires).toBeInstanceOf(Date);
    });
  });
}); 