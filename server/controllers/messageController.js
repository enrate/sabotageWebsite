const { Message, User, Notification } = require('../models');
const { Op } = require('sequelize');
const { getIO } = require('../socket');

// Получить список диалогов (уникальные собеседники)
exports.getDialogs = async (req, res) => {
  try {
    console.log('getDialogs called', req.user);
    const userId = req.user.id;
    // Получаем последние сообщения с каждым собеседником
    const dialogs = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    // Группируем по собеседнику
    const unique = {};
    dialogs.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!unique[otherId]) unique[otherId] = msg;
    });
    res.json(Object.values(unique));
  } catch (err) {
    console.error('DIALOGS ERROR:', err);
    res.status(500).json({ message: 'Ошибка получения диалогов' });
  }
};

// Получить переписку с конкретным пользователем
exports.getChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.userId;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'avatar'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения сообщений' });
  }
};

// Отправить сообщение
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ message: 'receiverId и content обязательны' });
    const message = await Message.create({ senderId, receiverId, content });
    const fullMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['id', 'username', 'avatar'] }
      ]
    });
    // --- SOCKET.IO: отправить событие всем клиентам ---
    const io = getIO();
    console.log('[SOCKET] emit new_message to ALL');
    io.emit('new_message', fullMessage);
    // --- Создать уведомление для получателя ---
    await Notification.create({
      userId: receiverId,
      type: 'message',
      data: {
        senderId,
        senderUsername: fullMessage.sender.username,
        messageId: fullMessage.id
      },
      isRead: false
    });
    res.status(201).json(fullMessage);
  } catch (err) {
    console.error('SEND MESSAGE ERROR:', err);
    res.status(500).json({ message: 'Ошибка отправки сообщения' });
  }
};

// Пометить сообщения как прочитанные
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.userId;
    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          senderId: otherId,
          receiverId: userId,
          isRead: false
        }
      }
    );
    // Получить id обновлённых сообщений
    const updatedMessages = await Message.findAll({
      where: {
        senderId: otherId,
        receiverId: userId,
        isRead: true
      }
    });
    const messageIds = updatedMessages.map(m => m.id);
    console.log('[SOCKET] markAsRead updated', updatedCount, 'messages for', { readerId: userId, senderId: otherId, messageIds });
    // Реактивно уведомить отправителя через сокет
    const io = getIO();
    console.log('[SOCKET] emit messages_read', { readerId: userId, senderId: otherId, messageIds });
    io.emit('messages_read', { readerId: userId, senderId: otherId, messageIds });
    res.json({ message: 'Сообщения помечены как прочитанные' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при обновлении статуса' });
  }
}; 