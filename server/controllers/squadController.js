const { Squad, User, JoinRequest, SquadHistory, SquadWarning, SquadRole, SquadInvite, Notification } = require('../models');

// Вспомогательная функция для преобразования ролей участников
const transformSquadMembers = async (squad, members) => {
  const result = [];
  
  for (const member of members) {
    let squadRole = 'member'; // По умолчанию участник
    
    // Определяем отрядную роль
    if (member.id === squad.leaderId) {
      squadRole = 'leader';
    } else {
      // Ищем роль в таблице squad_roles
      const squadRoleRecord = await SquadRole.findOne({
        where: { userId: member.id, squadId: squad.id }
      });
      
      if (squadRoleRecord) {
        squadRole = squadRoleRecord.role;
      }
    }
    
    result.push({
      ...member,
      squadRole: squadRole
    });
  }
  
  return result;
};

// Получение всех отрядов
exports.getAllSquads = async (req, res) => {
  try {
    const squads = await Squad.findAll({
      include: [
        { model: User, as: 'leader', attributes: ['id', 'username'] },
        { model: User, as: 'members', attributes: ['id', 'username', 'joinDate'] }
      ]
    });
    
    // Преобразуем данные всех отрядов
    const squadsData = [];
    for (const squad of squads) {
      const squadData = squad.toJSON();
      squadData.members = await transformSquadMembers(squad, squadData.members);
      squadsData.push(squadData);
    }
    
    res.json(squadsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения списка отрядов' });
  }
};

// Создание нового отряда
exports.createSquad = async (req, res) => {
  const { name, description, logo, performance, stats, tag } = req.body;
  try {
    const existingSquad = await Squad.findOne({ where: { name } });
    if (existingSquad) {
      return res.status(400).json({ message: 'Отряд с таким именем уже существует' });
    }
    
    // Проверяем уникальность тега, если он указан
    if (tag) {
      const existingTag = await Squad.findOne({ where: { tag } });
      if (existingTag) {
        return res.status(400).json({ message: 'Отряд с таким тегом уже существует' });
      }
    }
    
    // Проверка: пользователь не должен состоять в другом отряде
    const user = await User.findByPk(req.user.id);
    if (user && user.squadId) {
      return res.status(400).json({ message: 'Вы уже состоите в отряде. Сначала покиньте текущий отряд.' });
    }
    // Проверка: пользователь должен иметь armaId
    if (!user || !user.armaId) {
      return res.status(400).json({ message: 'Для создания отряда необходимо указать Arma ID в настройках профиля.' });
    }

    const newSquad = await Squad.create({
      name,
      description,
      logo,
      performance,
      stats,
      tag,
      leaderId: req.user.id
    });
    
    // Сохраняем текущую роль пользователя (admin остается admin)
    const currentRole = req.user.role;
    await User.update({ 
      squadId: newSquad.id,
      joinDate: new Date(), // Устанавливаем дату вступления для лидера
      role: currentRole // Сохраняем текущую роль (admin остается admin)
    }, { where: { id: req.user.id } });
    
    // Создаем запись в таблице squad_roles для лидера
    await SquadRole.create({
      userId: req.user.id,
      squadId: newSquad.id,
      role: 'leader' // Лидер должен иметь роль leader в squad_roles
    });
    
    // Отклоняем все приглашения в отряд для пользователя
    await SquadInvite.update(
      { status: 'declined' },
      { where: { userId: req.user.id, status: 'pending' } }
    );
    // Аннулируем все заявки пользователя в другие отряды
    await JoinRequest.update(
      { status: 'rejected' },
      { where: { userId: req.user.id, status: 'pending' } }
    );

    const squadWithMembers = await Squad.findByPk(newSquad.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'username'] },
        { model: User, as: 'members', attributes: ['id', 'username', 'joinDate'] }
      ]
    });
    
    // Преобразуем данные участников, добавляя отрядную роль
    const squadData = squadWithMembers.toJSON();
    squadData.members = await transformSquadMembers(squadWithMembers, squadData.members);
    
    res.status(201).json(squadData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка создания отряда' });
  }
};

// Вступление в отряд
exports.joinSquad = async (req, res) => {
  const squadId = req.params.id;
  try {
    const squad = await Squad.findByPk(squadId, {
      include: [{ model: User, as: 'members' }]
    });
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    if (squad.members.some(member => member.id === req.user.id)) {
      return res.status(400).json({ message: 'Вы уже состоите в этом отряде' });
    }
    
    // Сохраняем текущую роль пользователя (admin остается admin)
    const currentRole = req.user.role;
    await User.update({ 
      squadId: squad.id,
      joinDate: new Date(), // Устанавливаем дату вступления
      role: currentRole // Сохраняем текущую роль (admin остается admin)
    }, { where: { id: req.user.id } });
    
    // Создаем запись в таблице squad_roles
    await SquadRole.create({
      userId: req.user.id,
      squadId: squad.id,
      role: 'member'
    });
    
    // Создаем запись в истории
    await SquadHistory.create({
      squadId: squad.id,
      userId: req.user.id,
      eventType: 'join',
      description: `${req.user.username} вступил в отряд`,
      metadata: {
        actionBy: req.user.id,
        actionByUsername: req.user.username
      }
    });
    
    // Отклоняем все приглашения в отряд для пользователя
    await SquadInvite.update(
      { status: 'declined' },
      { where: { userId: req.user.id, status: 'pending' } }
    );
    // Аннулируем все заявки пользователя в другие отряды
    await JoinRequest.update(
      { status: 'rejected' },
      { where: { userId: req.user.id, status: 'pending' } }
    );

    res.json({ message: 'Вы успешно вступили в отряд' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка вступления в отряд' });
  }
};

// Выход из отряда
exports.leaveSquad = async (req, res) => {
  const squadId = req.params.id;
  try {
    const squad = await Squad.findByPk(squadId, {
      include: [{ model: User, as: 'members' }]
    });
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    if (!squad.members.some(member => member.id === req.user.id)) {
      return res.status(400).json({ message: 'Вы не состоите в этом отряде' });
    }
    
    const eventType = squad.leaderId === req.user.id ? 'leave' : 'leave';
    const description = squad.leaderId === req.user.id 
      ? `${req.user.username} покинул отряд (был лидером)`
      : `${req.user.username} покинул отряд`;
    
    await User.update({ 
      squadId: null,
      joinDate: null // Сбрасываем дату вступления при выходе из отряда
    }, { where: { id: req.user.id } });
    
    // Удаляем запись из таблицы squad_roles
    await SquadRole.destroy({
      where: { userId: req.user.id, squadId: squad.id }
    });
    
    // Создаем запись в истории
    await SquadHistory.create({
      squadId: squad.id,
      userId: req.user.id,
      eventType,
      description,
      metadata: {
        actionBy: req.user.id,
        actionByUsername: req.user.username
      }
    });
    
    // Если пользователь был лидером, назначаем нового лидера или удаляем отряд
    if (squad.leaderId === req.user.id) {
      const remainingMembers = await squad.getMembers();
      if (remainingMembers.length > 0) {
        await squad.update({ leaderId: remainingMembers[0].id });
        // Записываем смену лидера
        await SquadHistory.create({
          squadId: squad.id,
          userId: remainingMembers[0].id,
          eventType: 'promote',
          description: `${remainingMembers[0].username} стал новым лидером отряда`,
          metadata: {
            actionBy: req.user.id,
            actionByUsername: req.user.username
          }
        });
      } else {
        await squad.destroy();
        return res.json({ message: 'Вы покинули отряд, и так как вы были последним участником, отряд был удален' });
      }
    }
    res.json({ message: 'Вы успешно покинули отряд' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка выхода из отряда' });
  }
};

// Удаление отряда
exports.deleteSquad = async (req, res) => {
  const squadId = req.params.id;
  try {
    const squad = await Squad.findByPk(squadId, {
      include: [{ model: User, as: 'members' }]
    });
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    if (squad.leaderId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав для удаления отряда' });
    }
    
    // Сначала удаляем все связанные записи
    // Удаляем все записи из squad_roles для этого отряда
    await SquadRole.destroy({
      where: { squadId: squadId }
    });
    
    // Удаляем все записи из squad_history для этого отряда
    await SquadHistory.destroy({
      where: { squadId: squadId }
    });
    
    // Удаляем все записи из squad_warnings для этого отряда
    await SquadWarning.destroy({
      where: { squadId: squadId }
    });
    
    // Удаляем все заявки на вступление для этого отряда
    await JoinRequest.destroy({
      where: { squadId: squadId }
    });
    
    // Обновляем всех участников отряда
    console.log(`Обновляем ${squad.members.length} участников отряда ${squadId}`);
    for (const member of squad.members) {
      try {
        const result = await User.update({ 
        squadId: null,
        joinDate: null // Сбрасываем дату вступления при удалении отряда
      }, { where: { id: member.id } });
        console.log(`Обновлен пользователь ${member.id}: ${result[0]} записей изменено`);
      } catch (error) {
        console.error(`Ошибка обновления пользователя ${member.id}:`, error);
      }
    }
    
    // Дополнительно обновляем всех пользователей, которые могут быть связаны с этим отрядом
    await User.update({ 
      squadId: null,
      joinDate: null
    }, { where: { squadId: squadId } });
    
    // Теперь удаляем сам отряд
    await squad.destroy();
    
    // Проверяем, что все пользователи были правильно обновлены
    const remainingUsers = await User.findAll({
      where: { squadId: squadId }
    });
    
    if (remainingUsers.length > 0) {
      console.warn(`После удаления отряда ${squadId} осталось ${remainingUsers.length} пользователей с squadId=${squadId}`);
      // Принудительно обновляем оставшихся пользователей
      await User.update({ 
        squadId: null,
        joinDate: null
      }, { where: { squadId: squadId } });
    }
    
    res.json({ message: 'Отряд успешно удален' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления отряда' });
  }
};

// Получение одного отряда по id
exports.getSquadById = async (req, res) => {
  try {
    const squad = await Squad.findByPk(req.params.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'username'] },
        { model: User, as: 'members', attributes: ['id', 'username', 'avatar', 'joinDate'] }
      ]
    });
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    
    // Преобразуем данные участников, добавляя отрядную роль
    const squadData = squad.toJSON();
    squadData.members = await transformSquadMembers(squad, squadData.members);
    
    res.json(squadData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения отряда' });
  }
};

// Обновление отряда (только для лидера или админа)
exports.updateSquad = async (req, res) => {
  try {
    const squad = await Squad.findByPk(req.params.id);
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    if (req.user.role !== 'admin' && req.user.id !== squad.leaderId) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    const { logo, description, isJoinRequestOpen, tag } = req.body;
    
    // Проверяем уникальность тега, если он указан
    if (tag && tag !== squad.tag) {
      const existingTag = await Squad.findOne({ where: { tag } });
      if (existingTag) {
        return res.status(400).json({ message: 'Отряд с таким тегом уже существует' });
      }
    }
    
    if (typeof logo !== 'undefined') squad.logo = logo;
    if (typeof description !== 'undefined') squad.description = description;
    if (typeof isJoinRequestOpen !== 'undefined') squad.isJoinRequestOpen = isJoinRequestOpen;
    if (typeof tag !== 'undefined') squad.tag = tag;
    await squad.save();
    res.json(squad);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления отряда' });
  }
};

// Создать заявку на вступление в отряд
exports.createJoinRequest = async (req, res) => {
  const squadId = req.params.id;
  try {
    // Проверка: не верифицирован ли пользователь
    if (!req.user.armaId) {
      return res.status(400).json({ message: 'Для подачи заявки в отряд необходимо указать Arma ID в настройках профиля' });
    }
    // Проверка: не состоит ли уже пользователь в отряде
    if (req.user.squadId) {
      return res.status(400).json({ message: 'Вы уже состоите в каком-либо отряде' });
    }
    // Проверка: нет ли уже заявки
    const existing = await JoinRequest.findOne({ where: { userId: req.user.id, squadId, status: 'pending' } });
    if (existing) {
      return res.status(400).json({ message: 'Заявка уже подана' });
    }
    const joinRequest = await JoinRequest.create({ userId: req.user.id, squadId, status: 'pending' });
    res.status(201).json(joinRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка подачи заявки' });
  }
};

// Отменить заявку на вступление в отряд
exports.cancelJoinRequest = async (req, res) => {
  const squadId = req.params.id;
  try {
    // Проверка: не состоит ли уже пользователь в отряде
    if (req.user.squadId) {
      return res.status(400).json({ message: 'Вы уже состоите в отряде' });
    }
    
    // Находим заявку пользователя
    const joinRequest = await JoinRequest.findOne({ 
      where: { userId: req.user.id, squadId, status: 'pending' } 
    });
    
    if (!joinRequest) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    
    // Удаляем заявку
    await joinRequest.destroy();
    res.json({ message: 'Заявка отменена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка отмены заявки' });
  }
};

// Получить все заявки на вступление в отряд (только для лидера/заместителя/админа)
exports.getJoinRequests = async (req, res) => {
  const squadId = parseInt(req.params.id);
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) return res.status(404).json({ message: 'Отряд не найден' });
    
    // Проверяем права (лидер, заместитель или админ)
    const isLeader = req.user.id === squad.leaderId;
    
    // Проверяем, что пользователь является заместителем в этом отряде
    const squadRole = await SquadRole.findOne({
      where: { userId: req.user.id, squadId: squadId }
    });
    const isDeputy = squadRole && squadRole.role === 'deputy';
    const isAdmin = req.user.role === 'admin';
    
    if (!isLeader && !isDeputy && !isAdmin) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const requests = await JoinRequest.findAll({
      where: { squadId, status: 'pending' },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
    });
    res.json(requests);
  } catch (err) {
    console.error('getJoinRequests error:', err);
    res.status(500).json({ message: 'Ошибка получения заявок' });
  }
};

// Получить статус заявки пользователя
exports.getUserJoinRequestStatus = async (req, res) => {
  const squadId = req.params.id;
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) return res.status(404).json({ message: 'Отряд не найден' });
    
    // Проверяем, есть ли активная заявка от пользователя (только pending)
    const userRequest = await JoinRequest.findOne({
      where: { 
        squadId, 
        userId: req.user.id,
        status: 'pending'
      },
      order: [['createdAt', 'DESC']] // Берем самую свежую заявку
    });
    
    if (userRequest) {
      res.json({ status: userRequest.status });
    } else {
      res.json({ status: null });
    }
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения статуса заявки' });
  }
};

// Получить историю отряда
exports.getSquadHistory = async (req, res) => {
  const squadId = req.params.id;
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) return res.status(404).json({ message: 'Отряд не найден' });
    
    const history = await SquadHistory.findAll({
      where: { squadId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50 // Ограничиваем последними 50 событиями
    });
    
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения истории отряда' });
  }
};

// Получить предупреждения отряда (публичный доступ)
exports.getSquadWarningsPublic = async (req, res) => {
  const squadId = req.params.id;
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) return res.status(404).json({ message: 'Отряд не найден' });
    
    const warnings = await SquadWarning.findAll({
      where: { squadId, isActive: true },
      include: [
        { model: User, as: 'admin', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(warnings);
  } catch (err) {
    console.error('Ошибка получения предупреждений:', err);
    res.status(500).json({ message: 'Ошибка получения предупреждений' });
  }
};

// Одобрить/отклонить заявку на вступление
exports.handleJoinRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // 'approve' или 'reject'
  try {
    const joinRequest = await JoinRequest.findByPk(requestId, { 
      include: [
        { model: Squad, as: 'squad' },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ]
    });
    if (!joinRequest) return res.status(404).json({ message: 'Заявка не найдена' });
    // Проверяем права (лидер, заместитель или админ)
    const isLeader = req.user.id === joinRequest.squad.leaderId;
    
    // Проверяем, что пользователь является заместителем в этом отряде
    const squadRole = await SquadRole.findOne({
      where: { userId: req.user.id, squadId: joinRequest.squadId }
    });
    const isDeputy = squadRole && squadRole.role === 'deputy';
    const isAdmin = req.user.role === 'admin';
    
    if (!isLeader && !isDeputy && !isAdmin) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    if (action === 'approve') {
      joinRequest.status = 'approved';
      await joinRequest.save();
      
      // Получаем пользователя, чтобы сохранить его текущую роль
      const user = await User.findByPk(joinRequest.userId);
      const currentRole = user ? user.role : 'member'; // По умолчанию member, если пользователь не найден
      
      await User.update({ 
        squadId: joinRequest.squadId,
        joinDate: new Date(), // Устанавливаем дату вступления при одобрении заявки
        role: currentRole // Сохраняем текущую роль (admin остается admin)
      }, { where: { id: joinRequest.userId } });
      
      // Создаем запись в таблице squad_roles
      await SquadRole.create({
        userId: joinRequest.userId,
        squadId: joinRequest.squadId,
        role: 'member'
      });
      
      // Создаем запись в истории
      await SquadHistory.create({
        squadId: joinRequest.squadId,
        userId: joinRequest.userId,
        eventType: 'join',
        description: `${joinRequest.user.username} был принят в отряд`,
        metadata: {
          actionBy: req.user.id,
          actionByUsername: req.user.username
        }
      });
    } else if (action === 'reject') {
      joinRequest.status = 'rejected';
      await joinRequest.save();
      
      // Создаем запись в истории
      await SquadHistory.create({
        squadId: joinRequest.squadId,
        userId: joinRequest.userId,
        eventType: 'kick',
        description: `Заявка ${joinRequest.user.username} была отклонена`,
        metadata: {
          actionBy: req.user.id,
          actionByUsername: req.user.username
        }
      });
    } else {
      return res.status(400).json({ message: 'Некорректное действие' });
    }
    res.json(joinRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обработки заявки' });
  }
};

// Повысить участника до заместителя
exports.promoteMember = async (req, res) => {
  const { squadId, userId } = req.params;
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    
    // Проверяем права (только лидер может повышать)
    if (req.user.id !== squad.leaderId) {
      return res.status(403).json({ message: 'Недостаточно прав для повышения участника' });
    }
    
    // Проверяем, что пользователь состоит в отряде
    const member = await User.findOne({
      where: { id: userId, squadId: squadId }
    });
    
    if (!member) {
      return res.status(404).json({ message: 'Участник не найден в отряде' });
    }
    
    // Проверяем, что это не сам лидер
    if (userId === squad.leaderId) {
      return res.status(400).json({ message: 'Нельзя повысить самого себя' });
    }
    
    // Обновляем или создаем запись в таблице squad_roles
    const existingRole = await SquadRole.findOne({
      where: { userId: userId, squadId: squadId }
    });
    
    if (existingRole) {
      await existingRole.update({ role: 'deputy' });
    } else {
      await SquadRole.create({
        userId: userId,
        squadId: squadId,
        role: 'deputy'
      });
    }
    
    // Создаем запись в истории с указанием автора действия
    await SquadHistory.create({
      squadId: squadId,
      userId: userId,
      eventType: 'promote',
      description: `${member.username} был повышен до заместителя`,
      metadata: { 
        actionBy: req.user.id,
        actionByUsername: req.user.username
      }
    });
    
    res.json({ message: 'Участник успешно повышен до заместителя' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка повышения участника' });
  }
};

// Понизить заместителя до участника
exports.demoteMember = async (req, res) => {
  const { squadId, userId } = req.params;
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    
    // Проверяем права (только лидер может понижать)
    if (req.user.id !== squad.leaderId) {
      return res.status(403).json({ message: 'Недостаточно прав для понижения участника' });
    }
    
    // Проверяем, что пользователь состоит в отряде
    const member = await User.findOne({
      where: { id: userId, squadId: squadId }
    });
    
    if (!member) {
      return res.status(404).json({ message: 'Участник не найден в отряде' });
    }
    
    // Проверяем, что это не сам лидер
    if (userId === squad.leaderId) {
      return res.status(400).json({ message: 'Нельзя понизить самого себя' });
    }
    
    // Обновляем роль в таблице squad_roles
    const existingRole = await SquadRole.findOne({
      where: { userId: userId, squadId: squadId }
    });
    
    if (existingRole) {
      await existingRole.update({ role: 'member' });
    } else {
      await SquadRole.create({
        userId: userId,
        squadId: squadId,
        role: 'member'
      });
    }
    
    // Создаем запись в истории с указанием автора действия
    await SquadHistory.create({
      squadId: squadId,
      userId: userId,
      eventType: 'demote',
      description: `${member.username} был понижен до участника`,
      metadata: { 
        actionBy: req.user.id,
        actionByUsername: req.user.username
      }
    });
    
    res.json({ message: 'Заместитель успешно понижен до участника' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка понижения участника' });
  }
};

// Исключить участника из отряда
exports.kickMember = async (req, res) => {
  const { squadId, userId } = req.params;
  try {
    const squad = await Squad.findByPk(squadId);
    if (!squad) {
      return res.status(404).json({ message: 'Отряд не найден' });
    }
    
    // Проверяем права (лидер или заместитель может исключать)
    const isLeader = req.user.id === squad.leaderId;
    
    // Проверяем, что пользователь является заместителем в этом отряде
    const squadRole = await SquadRole.findOne({
      where: { userId: req.user.id, squadId: squadId }
    });
    const isDeputy = squadRole && squadRole.role === 'deputy';
    
    if (!isLeader && !isDeputy) {
      return res.status(403).json({ message: 'Недостаточно прав для исключения участника' });
    }
    
    // Проверяем, что пользователь состоит в отряде
    const member = await User.findOne({
      where: { id: userId, squadId: squadId }
    });
    
    if (!member) {
      return res.status(404).json({ message: 'Участник не найден в отряде' });
    }
    
    // Проверяем, что это не сам лидер
    if (userId === squad.leaderId) {
      return res.status(400).json({ message: 'Нельзя исключить самого себя' });
    }
    
    // Заместитель не может исключать других заместителей
    const memberSquadRole = await SquadRole.findOne({
      where: { userId: userId, squadId: squadId }
    });
    if (isDeputy && memberSquadRole && memberSquadRole.role === 'deputy') {
      return res.status(403).json({ message: 'Заместитель не может исключать других заместителей' });
    }
    
    // Исключаем пользователя из отряда
    const currentRole = member.role; // Сохраняем текущую роль
    await User.update({ 
      squadId: null,
      joinDate: null,
      role: currentRole // Сохраняем текущую роль (admin остается admin)
    }, { where: { id: userId } });
    
    // Удаляем запись из таблицы squad_roles
    await SquadRole.destroy({
      where: { userId: userId, squadId: squadId }
    });
    
    // Создаем запись в истории с указанием автора действия
    await SquadHistory.create({
      squadId: squadId,
      userId: userId,
      eventType: 'kick',
      description: `${member.username} был исключен из отряда`,
      metadata: { 
        actionBy: req.user.id,
        actionByUsername: req.user.username
      }
    });
    
    res.json({ message: 'Участник успешно исключен из отряда' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка исключения участника' });
  }
};

// Пригласить пользователя в отряд
exports.inviteToSquad = async (req, res) => {
  try {
    const squadId = parseInt(req.params.id);
    const { userId } = req.body; // id пользователя, которого приглашают
    const inviterId = req.user.id;

    // Проверка: существует ли отряд
    const squad = await Squad.findByPk(squadId);
    if (!squad) return res.status(404).json({ message: 'Отряд не найден' });

    // Проверка: права (лидер или заместитель)
    const isLeader = squad.leaderId === inviterId;
    const squadRole = await SquadRole.findOne({ where: { userId: inviterId, squadId } });
    const isDeputy = squadRole && squadRole.role === 'deputy';
    if (!isLeader && !isDeputy) return res.status(403).json({ message: 'Нет прав приглашать в отряд' });

    // Проверка: не состоит ли уже пользователь в отряде
    const invitedUser = await User.findByPk(userId);
    if (!invitedUser) return res.status(404).json({ message: 'Пользователь не найден' });
    if (invitedUser.squadId) return res.status(400).json({ message: 'Пользователь уже состоит в отряде' });
    
    // Проверка: верифицирован ли приглашаемый пользователь
    if (!invitedUser.armaId) {
      return res.status(400).json({ message: 'Нельзя пригласить не верифицированного пользователя. Попросите его указать Arma ID в настройках профиля' });
    }

    // Проверка: нет ли уже активного приглашения
    const existingInvite = await SquadInvite.findOne({
      where: { squadId, userId, status: 'pending' }
    });
    if (existingInvite) return res.status(400).json({ message: 'Уже есть активное приглашение' });

    // Создать приглашение
    const invite = await SquadInvite.create({
      squadId,
      userId,
      invitedBy: inviterId,
      status: 'pending'
    });

    // Создать уведомление (если есть модель Notification)
    if (Notification) {
      const notification = await Notification.create({
        userId: userId,
        type: 'squad_invite',
        data: {
          squadId,
          inviterId,
          inviteId: invite.id,
          squadName: squad.name,
          inviterUsername: req.user.username
        },
        message: `Вас пригласили в отряд "${squad.name}"`,
        isRead: false
      });
      
      // Публикация уведомления в Redis для real-time
      const { createClient } = require('redis');
      const redis = createClient({ url: 'redis://localhost:6379' });
      await redis.connect();
      await redis.publish('new_notification', JSON.stringify(notification));
      await redis.disconnect();
    }

    // Добавить в историю отряда
    await SquadHistory.create({
      squadId,
      userId: inviterId,
      eventType: 'invite',
      description: `${req.user.username} пригласил(а) ${invitedUser.username} в отряд`,
      metadata: { invitedUserId: userId, invitedUsername: invitedUser.username }
    });

    res.json({ message: 'Приглашение отправлено' });
  } catch (err) {
    console.error('Ошибка приглашения в отряд:', err);
    res.status(500).json({ message: 'Ошибка приглашения в отряд' });
  }
};

// Принять приглашение в отряд
exports.acceptSquadInvite = async (req, res) => {
  try {
    const inviteId = req.params.inviteId;
    const userId = req.user.id;
    const invite = await SquadInvite.findOne({ where: { id: inviteId, userId } });
    if (!invite || invite.status !== 'pending') return res.status(404).json({ message: 'Приглашение не найдено или уже обработано' });

    // Проверка: пользователь не состоит в отряде
    const user = await User.findByPk(userId);
    if (user.squadId) return res.status(400).json({ message: 'Вы уже состоите в отряде' });
    
    // Проверка: верифицирован ли пользователь
    if (!user.armaId) {
      return res.status(400).json({ message: 'Для вступления в отряд необходимо указать Arma ID в настройках профиля' });
    }

    // Обновить статус приглашения
    invite.status = 'accepted';
    await invite.save();

    // Добавить пользователя в отряд
    user.squadId = invite.squadId;
    user.joinDate = new Date();
    await user.save();

    // Добавить роль в SquadRole
    await SquadRole.create({ userId, squadId: invite.squadId, role: 'member' });

    // Добавить в историю отряда
    await SquadHistory.create({
      squadId: invite.squadId,
      userId,
      eventType: 'invite_accept',
      description: `${user.username} принял(а) приглашение в отряд`,
      metadata: { inviterId: invite.invitedBy }
    });

    res.json({ message: 'Вы вступили в отряд' });
  } catch (err) {
    console.error('Ошибка принятия приглашения:', err);
    res.status(500).json({ message: 'Ошибка принятия приглашения' });
  }
};

// Отклонить приглашение в отряд
exports.declineSquadInvite = async (req, res) => {
  try {
    const inviteId = req.params.inviteId;
    const userId = req.user.id;
    const invite = await SquadInvite.findOne({ where: { id: inviteId, userId } });
    if (!invite || invite.status !== 'pending') return res.status(404).json({ message: 'Приглашение не найдено или уже обработано' });

    invite.status = 'declined';
    await invite.save();

    res.json({ message: 'Приглашение отклонено' });
  } catch (err) {
    console.error('Ошибка отклонения приглашения:', err);
    res.status(500).json({ message: 'Ошибка отклонения приглашения' });
  }
};

// Проверить существующее приглашение
exports.checkSquadInvite = async (req, res) => {
  try {
    const squadId = parseInt(req.params.squadId);
    const userId = parseInt(req.params.userId);
    const inviterId = req.user.id;

    // Проверка: существует ли отряд
    const squad = await Squad.findByPk(squadId);
    if (!squad) return res.status(404).json({ message: 'Отряд не найден' });

    // Проверка: права (лидер или заместитель)
    const isLeader = squad.leaderId === inviterId;
    const squadRole = await SquadRole.findOne({ where: { userId: inviterId, squadId } });
    const isDeputy = squadRole && squadRole.role === 'deputy';
    if (!isLeader && !isDeputy) return res.status(403).json({ message: 'Нет прав проверять приглашения' });

    // Проверка: есть ли активное приглашение
    const existingInvite = await SquadInvite.findOne({
      where: { squadId, userId, status: 'pending' }
    });

    res.json({ hasInvite: !!existingInvite });
  } catch (err) {
    console.error('Ошибка проверки приглашения:', err);
    res.status(500).json({ message: 'Ошибка проверки приглашения' });
  }
};

// Получить все приглашения в отряд для текущего пользователя
exports.getUserSquadInvites = async (req, res) => {
  try {
    const userId = req.user.id;
    const invites = await SquadInvite.findAll({
      where: { userId },
      include: [
        { model: User, as: 'inviter', attributes: ['id', 'username'] },
        { model: Squad, as: 'squad', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(invites);
  } catch (err) {
    console.error('Ошибка получения приглашений:', err);
    res.status(500).json({ message: 'Ошибка получения приглашений' });
  }
};

exports.getSquadStats = async (req, res) => {
  try {
    const { squadId } = req.params;
    const SquadStats = require('../models').SquadStats;
    const stats = await SquadStats.findOne({ where: { squadId } });
    if (!stats) {
      return res.status(404).json({ kills: '0', deaths: '0' });
    }
    res.json({ kills: stats.kills, deaths: stats.deaths });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики отряда' });
  }
};