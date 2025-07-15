const { User, SquadRole, Squad } = require('../models');
const jwt = require('jsonwebtoken');
const { generateVerificationToken, sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { createClient } = require('redis');
const redis = createClient({ url: 'redis://localhost:6379' });
redis.connect();
const { Op } = require('sequelize');

// Регистрация пользователя
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Проверка на существующего пользователя по email
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Проверка на существующего пользователя по username
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      if (!existingUserByUsername.emailVerified) {
        // Если email не подтверждён — перезаписываем email, генерируем новый токен и отправляем письмо
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
        await existingUserByUsername.update({
          email,
          password, // обновляем пароль на новый
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires
        });
        // Отправляем письмо
        await redis.publish('send_verification_email', JSON.stringify({
          email,
          username,
          token: verificationToken
        }));
        return res.status(200).json({
          message: 'Регистрация успешна! Проверьте ваш email для подтверждения аккаунта.',
          user: {
            id: existingUserByUsername.id,
            username: existingUserByUsername.username,
            email: existingUserByUsername.email,
            role: existingUserByUsername.role,
            emailVerified: existingUserByUsername.emailVerified
          }
        });
      } else {
        // Если email подтверждён — ошибка
        return res.status(400).json({ message: 'Пользователь с таким username уже существует' });
      }
    }

    // Обычная регистрация (username и email свободны)
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
    // Поиск пользователя по email или username
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username: email }
        ]
      }
    });
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
            armaId: user.armaId,
            discordId: user.discordId,
            discordUsername: user.discordUsername,
            twitchId: user.twitchId,
            twitchUsername: user.twitchUsername,
            youtubeId: user.youtubeId,
            youtubeUsername: user.youtubeUsername
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
    const { id, username, email, role, squadId, avatar, description, isLookingForSquad, createdAt, armaId, discordId, discordUsername, twitchId, twitchUsername, youtubeId, youtubeUsername } = user;
    res.json({ id, username, email, role, squadId, avatar, description, isLookingForSquad, createdAt, squadRole, armaId, discordId, discordUsername, twitchId, twitchUsername, youtubeId, youtubeUsername });
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
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        twitchId: user.twitchId,
        twitchUsername: user.twitchUsername,
        youtubeId: user.youtubeId,
        youtubeUsername: user.youtubeUsername,
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

// Восстановление пароля (запрос на email)
exports.forgotPassword = async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ message: 'Укажите никнейм и email' });
  }
  try {
    const user = await User.findOne({ where: { username, email } });
    if (!user) {
      // Не раскрываем, что пользователя нет
      return res.status(200).json({ message: 'Письмо с восстановлением пароля отправлено, если данные верны.' });
    }
    // Проверка: если уже есть активный токен и не истёк
    if (user.passwordResetToken && user.passwordResetExpires && user.passwordResetExpires > new Date()) {
      return res.status(429).json({ message: 'Письмо для сброса пароля уже отправлено. Проверьте почту.' });
    }
    // Проверка лимита: не более 2 раз в сутки
    const since = new Date(Date.now() - 24*60*60*1000);
    const recentRequests = await User.count({
      where: {
        id: user.id,
        passwordResetExpires: { [Op.gt]: since }
      }
    });
    if (recentRequests >= 2) {
      return res.status(429).json({ message: 'Вы уже запрашивали восстановление пароля 2 раза за сутки. Попробуйте позже.' });
    }
    // Генерируем токен и сохраняем
    const token = generateVerificationToken();
    const expires = new Date(Date.now() + 60*60*1000); // 1 час
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();
    // Отправляем письмо
    await sendPasswordResetEmail(user.email, user.username, token);
    return res.status(200).json({ message: 'Письмо с восстановлением пароля отправлено, если данные верны.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Сброс пароля по токену
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Некорректные данные' });
  }
  try {
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: new Date() }
      }
    });
    if (!user) {
      return res.status(400).json({ message: 'Ссылка для сброса пароля недействительна или устарела.' });
    }
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.status(200).json({ message: 'Пароль успешно изменён.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};