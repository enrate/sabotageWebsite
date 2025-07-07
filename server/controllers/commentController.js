const { Comment, User, News } = require('../models');

// Получение комментариев к новости
exports.getComments = async (req, res) => {
  try {
    const { newsId } = req.params;
    
    const comments = await Comment.findAll({
      where: { 
        newsId,
        parentId: null // Только корневые комментарии
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'avatar']
            }
          ]
        }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC']
      ]
    });

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Создание комментария
exports.createComment = async (req, res) => {
  try {
    const { content, newsId, parentId } = req.body;
    
    // Проверяем существование новости
    const news = await News.findByPk(newsId);
    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    // Если это ответ на комментарий, проверяем существование родительского комментария
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Родительский комментарий не найден' });
      }
    }

    const comment = await Comment.create({
      content,
      newsId,
      userId: req.user.id,
      parentId: parentId || null
    });

    // Получаем созданный комментарий с данными пользователя
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });

    res.status(201).json(commentWithUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Обновление комментария
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    // Проверяем права доступа
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для редактирования' });
    }

    await comment.update({ content });

    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });

    res.json(updatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Удаление комментария
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    // Проверяем права доступа
    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для удаления' });
    }

    // Удаляем комментарий и все его ответы
    await Comment.destroy({
      where: {
        [require('sequelize').Op.or]: [
          { id },
          { parentId: id }
        ]
      }
    });

    res.json({ message: 'Комментарий удален' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}; 