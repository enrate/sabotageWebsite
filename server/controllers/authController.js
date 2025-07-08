const { User, SquadRole, Squad } = require('../models');
const jwt = require('jsonwebtoken');

// Регистрация пользователя
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }
    
    // Создание нового пользователя
    const user = await User.create({ username, email, password });
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    // Создание JWT токена
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        squadId: user.squadId,
        avatar: user.avatar,
        description: user.description
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
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    // Создание JWT токена
    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        squadId: user.squadId,
        avatar: user.avatar,
        description: user.description
      }
    });
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
    const { id, username, email, role, squadId, avatar, description, isLookingForSquad, createdAt } = user;
    res.json({ id, username, email, role, squadId, avatar, description, isLookingForSquad, createdAt, squadRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};