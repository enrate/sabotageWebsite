const { User } = require('../models');

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'avatar', 'role', 'description', 'email', 'squadId', 'createdAt', 'isLookingForSquad']
    });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    // Скрывать email, если не свой профиль и не админ
    if (!req.user || (req.user.id !== user.id && req.user.role !== 'admin')) {
      user.email = undefined;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения пользователя' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, description, avatar, armaId, isLookingForSquad } = req.body;
    const userId = req.user.id;

    // Проверяем, что пользователь существует
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем уникальность username, если он изменился
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
      }
    }

    // Проверяем уникальность armaId, если он изменился
    if (armaId && armaId !== user.armaId) {
      // Если у пользователя уже есть Arma ID, запрещаем его изменение
      if (user.armaId) {
        return res.status(400).json({ message: 'Arma ID нельзя изменить после установки' });
      }
      
      const existingUser = await User.findOne({ where: { armaId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Пользователь с таким Arma ID уже существует' });
      }
    }

    // Обновляем профиль
    let newArmaId = armaId !== undefined ? armaId : user.armaId;
    if (newArmaId === '') newArmaId = null;
    await user.update({
      username: username || user.username,
      email: user.email, // Email нельзя изменять
      description: description !== undefined ? description : user.description,
      avatar: avatar !== undefined ? avatar : user.avatar,
      armaId: newArmaId, // Сохраняем null вместо пустой строки
      isLookingForSquad: isLookingForSquad !== undefined ? isLookingForSquad : user.isLookingForSquad
    });

    // Возвращаем обновленного пользователя
    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'avatar', 'role', 'description', 'email', 'squadId', 'armaId', 'joinDate', 'isLookingForSquad']
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
};

// Получить пользователей, ищущих отряд
exports.getLookingForSquadUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        isLookingForSquad: true,
        squadId: null
      },
      order: [['username', 'ASC']],
      attributes: ['id', 'username', 'avatar', 'description', 'createdAt']
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения пользователей' });
  }
}; 