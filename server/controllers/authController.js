const { User, SquadRole, Squad } = require('../models');
const jwt = require('jsonwebtoken');
const { generateVerificationToken, sendVerificationEmail } = require('../services/emailService');
const { createClient } = require('redis');
const redis = createClient({ url: 'redis://localhost:6379' });
redis.connect();

// Регистрация пользователя
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }
    
    // Генерация токена подтверждения
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    
    // Создание нового пользователя
    const user = await User.create({ 
      username, 
      email, 
      password,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });
    
    // Кладём задачу на отправку email в Redis (асинхронно)
    await redis.publish('send_verification_email', JSON.stringify({
      email,
      username,
      token: verificationToken
    }));
    
    // Сразу отвечаем пользователю
    res.status(200).json({ 
      message: 'Регистрация успешна! Проверьте ваш email для подтверждения аккаунта.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Вход пользователя
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }
    
    // Проверка блокировки
    if (user.isBanned) {
      return res.status(403).json({ message: 'Ваш аккаунт заблокирован. Причина: ' + (user.banReason || 'Не указана') });
    }
    
    // Проверка пароля
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }
    
    // Проверка подтверждения email
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Email не подтвержден. Проверьте вашу почту и перейдите по ссылке для подтверждения.',
        emailNotVerified: true
      });
    }
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    // Создание JWT токена
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    // Сохраняем userId в сессию для cookie-авторизации
    if (req.session) {
      req.session.userId = user.id;
      req.session.save(() => {
        res.json({ 
          token, 
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            squadId: user.squadId,
            avatar: user.avatar,
            description: user.description,
            armaId: user.armaId
          }
        });
      });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение информации о пользователе
exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    let squadRole = null;
    if (user.squadId) {
      // Проверяем, лидер ли пользователь
      const squad = await Squad.findByPk(user.squadId);
      if (squad && squad.leaderId === user.id) {
        squadRole = 'leader';
      } else {
        // Иначе ищем роль в SquadRole
        const roleRecord = await SquadRole.findOne({ where: { userId: user.id, squadId: user.squadId } });
        squadRole = roleRecord ? roleRecord.role : null;
      }
    }
    // Возвращаем только основные поля пользователя (без armaId, stats, verified)
    const { id, username, email, role, squadId, avatar, description, isLookingForSquad, createdAt, armaId } = user;
    res.json({ id, username, email, role, squadId, avatar, description, isLookingForSquad, createdAt, squadRole, armaId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Подтверждение email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;
  
  try {
    // Поиск пользователя по токену
    const user = await User.findOne({ 
      where: { 
        emailVerificationToken: token,
        emailVerificationExpires: { [require('sequelize').Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Недействительная или истекшая ссылка подтверждения' });
    }
    
    // Подтверждение email
    await user.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });
    
    // Создание JWT токена
    const payload = { userId: user.id };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      message: 'Email успешно подтвержден!',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        squadId: user.squadId,
        avatar: user.avatar,
        description: user.description,
        armaId: user.armaId,
        emailVerified: true
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Повторная отправка email подтверждения
exports.resendVerification = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email уже подтвержден' });
    }
    
    // Генерация нового токена
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    
    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });
    
    // Отправка email
    const emailSent = await sendVerificationEmail(email, user.username, verificationToken);
    
    if (!emailSent) {
      return res.status(500).json({ message: 'Ошибка отправки email' });
    }
    
    res.json({ message: 'Email подтверждения отправлен повторно' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};