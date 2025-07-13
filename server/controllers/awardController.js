const { Award, User, UserAward, Season } = require('../models');

// Получить все награды
exports.getAllAwards = async (req, res) => {
  try {
    const { category, isSeasonAward, isActive } = req.query;
    
    const whereClause = {};
    
    if (category) whereClause.category = category;
    if (isSeasonAward !== undefined) whereClause.isSeasonAward = isSeasonAward === 'true';
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const awards = await Award.findAll({
      where: whereClause,
      include: [
        {
          model: Season,
          as: 'season',
          attributes: ['id', 'name', 'startDate', 'endDate']
        }
      ],
      order: [['priority', 'DESC'], ['name', 'ASC']]
    });

    res.json(awards);
  } catch (err) {
    console.error('Ошибка при получении наград:', err);
    res.status(500).json({ error: 'Ошибка при получении наград' });
  }
};

// Получить награду по ID
exports.getAwardById = async (req, res) => {
  try {
    const award = await Award.findByPk(req.params.id, {
      include: [
        {
          model: Season,
          as: 'season',
          attributes: ['id', 'name', 'startDate', 'endDate']
        }
      ]
    });

    if (!award) {
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    res.json(award);
  } catch (err) {
    console.error('Ошибка при получении награды:', err);
    res.status(500).json({ error: 'Ошибка при получении награды' });
  }
};

// Создать новую награду
exports.createAward = async (req, res) => {
  try {
    // Обработка данных из FormData
    const processFormData = (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (value === 'null' || value === '') return null;
      if (!isNaN(value) && value !== '') return Number(value);
      return value;
    };

    const {
      type,
      name,
      description,
      category = 'general',
      isSeasonAward = false,
      assignmentType = 'manual',
      assignmentConditions,
      registrationDeadline,
      minMatches,
      minWins,
      minKills,
      minElo,
      seasonId,
      maxRecipients,
      priority = 0
    } = req.body;

    // Преобразуем данные из FormData
    const processedData = {
      type: processFormData(type),
      name: processFormData(name),
      description: processFormData(description),
      category: processFormData(category),
      isSeasonAward: processFormData(isSeasonAward),
      assignmentType: processFormData(assignmentType),
      assignmentConditions: assignmentConditions ? JSON.parse(assignmentConditions) : null,
      registrationDeadline: processFormData(registrationDeadline),
      minMatches: processFormData(minMatches),
      minWins: processFormData(minWins),
      minKills: processFormData(minKills),
      minElo: processFormData(minElo),
      seasonId: processFormData(seasonId),
      maxRecipients: processFormData(maxRecipients),
      priority: processFormData(priority),
      isActive: processFormData(req.body.isActive)
    };

    // Отладочная информация
    console.log('createAward - входящие данные:', {
      type,
      name,
      isSeasonAward,
      typeof_isSeasonAward: typeof isSeasonAward,
      seasonId,
      assignmentType
    });

    console.log('createAward - обработанные данные:', processedData);

    // Валидация
    if (!processedData.type || !processedData.name) {
      return res.status(400).json({ error: 'Тип и название награды обязательны' });
    }

    // Проверка для наград сезона
    if (processedData.isSeasonAward && !processedData.seasonId) {
      return res.status(400).json({ error: 'Для наград сезона необходимо указать ID сезона' });
    }

    // Проверка существования сезона
    if (processedData.seasonId) {
      const season = await Season.findByPk(processedData.seasonId);
      if (!season) {
        return res.status(404).json({ error: 'Сезон не найден' });
      }
    }

    // Обработка загруженного изображения
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const award = await Award.create({
      type: processedData.type,
      name: processedData.name,
      description: processedData.description,
      image: imagePath,
      category: processedData.category,
      isSeasonAward: processedData.isSeasonAward,
      assignmentType: processedData.assignmentType,
      assignmentConditions: processedData.assignmentConditions,
      registrationDeadline: processedData.registrationDeadline ? new Date(processedData.registrationDeadline) : null,
      minMatches: processedData.minMatches,
      minWins: processedData.minWins,
      minKills: processedData.minKills,
      minElo: processedData.minElo,
      seasonId: processedData.seasonId,
      maxRecipients: processedData.maxRecipients,
      priority: processedData.priority,
      isActive: processedData.isActive
    });

    res.status(201).json({
      success: true,
      message: 'Награда успешно создана',
      award
    });
  } catch (err) {
    console.error('Ошибка при создании награды:', err);
    res.status(500).json({ error: 'Ошибка при создании награды' });
  }
};

// Обновить награду
exports.updateAward = async (req, res) => {
  try {
    const award = await Award.findByPk(req.params.id);
    
    if (!award) {
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    const updateData = { ...req.body };
    
    // Преобразуем строковые значения в булевы
    if (updateData.isSeasonAward !== undefined) {
      updateData.isSeasonAward = updateData.isSeasonAward === 'true' || updateData.isSeasonAward === true;
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }
    
    // Обработка даты дедлайна
    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(updateData.registrationDeadline);
    }

    // Обработка загруженного изображения
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
      
      // Удаляем старое изображение если оно существует
      if (award.image && award.image.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const oldImagePath = path.join(__dirname, '..', award.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    await award.update(updateData);

    res.json({
      success: true,
      message: 'Награда успешно обновлена',
      award
    });
  } catch (err) {
    console.error('Ошибка при обновлении награды:', err);
    res.status(500).json({ error: 'Ошибка при обновлении награды' });
  }
};

// Удалить награду
exports.deleteAward = async (req, res) => {
  try {
    const award = await Award.findByPk(req.params.id);
    
    if (!award) {
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    // Проверяем, есть ли получатели у награды
    const recipientsCount = await UserAward.count({
      where: { awardId: award.id }
    });

    if (recipientsCount > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить награду, которая уже была выдана пользователям' 
      });
    }

    await award.destroy();

    res.json({
      success: true,
      message: 'Награда успешно удалена'
    });
  } catch (err) {
    console.error('Ошибка при удалении награды:', err);
    res.status(500).json({ error: 'Ошибка при удалении награды' });
  }
};

// Назначить награду пользователю
exports.assignAwardToUser = async (req, res) => {
  try {
    const { userId, awardId, comment } = req.body;
    const issuedBy = req.user.id; // ID текущего пользователя (админа)

    // Проверяем существование пользователя и награды
    const [user, award] = await Promise.all([
      User.findByPk(userId),
      Award.findByPk(awardId)
    ]);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!award) {
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    if (!award.isActive) {
      return res.status(400).json({ error: 'Награда неактивна' });
    }

    // Проверяем, не получил ли пользователь уже эту награду
    const existingAward = await UserAward.findOne({
      where: { userId, awardId }
    });

    if (existingAward) {
      return res.status(400).json({ error: 'Пользователь уже получил эту награду' });
    }

    // Проверяем лимит получателей
    if (!(await award.canAssignToUser())) {
      return res.status(400).json({ error: 'Достигнут лимит получателей награды' });
    }

    // Создаем запись о выдаче награды
    const userAward = await UserAward.create({
      userId,
      awardId,
      issuedBy,
      issuedAt: new Date(),
      seasonId: award.seasonId,
      comment: comment || null
    });

    res.status(201).json({
      success: true,
      message: 'Награда успешно назначена пользователю',
      userAward
    });
  } catch (err) {
    console.error('Ошибка при назначении награды:', err);
    res.status(500).json({ error: 'Ошибка при назначении награды' });
  }
};

// Отозвать награду у пользователя
exports.revokeAwardFromUser = async (req, res) => {
  try {
    const { userId, awardId } = req.params;

    const userAward = await UserAward.findOne({
      where: { userId, awardId }
    });

    if (!userAward) {
      return res.status(404).json({ error: 'Награда не найдена у пользователя' });
    }

    await userAward.destroy();

    res.json({
      success: true,
      message: 'Награда успешно отозвана у пользователя'
    });
  } catch (err) {
    console.error('Ошибка при отзыве награды:', err);
    res.status(500).json({ error: 'Ошибка при отзыве награды' });
  }
};

// Получить награды пользователя
exports.getUserAwards = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const userAwards = await UserAward.findAll({
      where: { userId },
      include: [
        {
          model: Award,
          attributes: ['id', 'name', 'description', 'image', 'type']
        }
      ],
      order: [['issuedAt', 'DESC']]
    });

    // Преобразуем в упрощенный формат
    const simplifiedAwards = userAwards.map(ua => ({
      id: ua.Award.id,
      name: ua.Award.name,
      description: ua.Award.description,
      image: ua.Award.image,
      type: ua.Award.type,
      isActive: user.activeAwardId === ua.Award.id
    }));

    res.json(simplifiedAwards);
  } catch (err) {
    console.error('Ошибка при получении наград пользователя:', err);
    res.status(500).json({ error: 'Ошибка при получении наград пользователя' });
  }
};

// Автоматически назначить награды по условиям
exports.autoAssignAwards = async (req, res) => {
  try {
    const { awardId } = req.params;
    const issuedBy = req.user.id; // ID текущего пользователя (админа)

    const award = await Award.findByPk(awardId);
    if (!award) {
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    if (award.assignmentType === 'manual') {
      return res.status(400).json({ error: 'Автоматическое назначение недоступно для ручных наград' });
    }

    // Получаем всех пользователей
    const users = await User.findAll();

    let assignedCount = 0;
    const results = [];

    for (const user of users) {
      // Проверяем, соответствует ли пользователь условиям
      const isEligible = await award.checkEligibility(user);
      
      if (isEligible) {
        // Проверяем, не получил ли пользователь уже эту награду
        const existingAward = await UserAward.findOne({
          where: { userId: user.id, awardId: award.id }
        });

        if (!existingAward && await award.canAssignToUser()) {
          await UserAward.create({
            userId: user.id,
            awardId: award.id,
            issuedBy,
            issuedAt: new Date(),
            seasonId: award.seasonId
          });

          assignedCount++;
          results.push({
            userId: user.id,
            username: user.username,
            assigned: true
          });
        } else {
          results.push({
            userId: user.id,
            username: user.username,
            assigned: false,
            reason: existingAward ? 'Уже получена' : 'Достигнут лимит'
          });
        }
      } else {
        results.push({
          userId: user.id,
          username: user.username,
          assigned: false,
          reason: 'Не соответствует условиям'
        });
      }
    }

    res.json({
      success: true,
      message: `Автоматическое назначение завершено. Назначено: ${assignedCount}`,
      assignedCount,
      results
    });
  } catch (err) {
    console.error('Ошибка при автоматическом назначении наград:', err);
    res.status(500).json({ error: 'Ошибка при автоматическом назначении наград' });
  }
};

// Получить статистику награды
exports.getAwardStatistics = async (req, res) => {
  try {
    const awardId = req.params.id;

    const award = await Award.findByPk(awardId);
    if (!award) {
      return res.status(404).json({ error: 'Награда не найдена' });
    }

    const recipientsCount = await UserAward.count({
      where: { awardId }
    });

    const recipients = await UserAward.findAll({
      where: { awardId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['issuedAt', 'DESC']]
    });

    res.json({
      award,
      statistics: {
        recipientsCount,
        maxRecipients: award.maxRecipients,
        isLimited: award.maxRecipients !== null,
        canAssignMore: award.maxRecipients ? recipientsCount < award.maxRecipients : true
      },
      recipients
    });
  } catch (err) {
    console.error('Ошибка при получении статистики награды:', err);
    res.status(500).json({ error: 'Ошибка при получении статистики награды' });
  }
};

// Получить награды сезона
exports.getSeasonAwards = async (req, res) => {
  try {
    const seasonId = req.params.seasonId;

    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Сезон не найден' });
    }

    const awards = await Award.findAll({
      where: {
        seasonId,
        isSeasonAward: true,
        isActive: true
      },
      order: [['priority', 'DESC'], ['name', 'ASC']]
    });

    res.json(awards);
  } catch (err) {
    console.error('Ошибка при получении наград сезона:', err);
    res.status(500).json({ error: 'Ошибка при получении наград сезона' });
  }
};

// Выдать награды сезона
exports.issueSeasonAwards = async (req, res) => {
  try {
    const seasonId = req.params.seasonId;

    const season = await Season.findByPk(seasonId);
    if (!season) {
      return res.status(404).json({ error: 'Сезон не найден' });
    }

    if (!season.canIssueAwards()) {
      return res.status(400).json({ 
        error: 'Награды сезона можно выдавать только после его окончания и только один раз' 
      });
    }

    await season.issueSeasonAwards();

    res.json({
      success: true,
      message: 'Награды сезона успешно выданы'
    });
  } catch (err) {
    console.error('Ошибка при выдаче наград сезона:', err);
    res.status(500).json({ error: 'Ошибка при выдаче наград сезона' });
  }
}; 