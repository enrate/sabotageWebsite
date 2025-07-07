const { News, User, Comment } = require('../models');

// Получение всех новостей
exports.getNews = async (req, res) => {
  try {
    const news = await News.findAll({
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: []
        }
      ],
      attributes: {
        include: [
          [News.sequelize.fn('COUNT', News.sequelize.col('comments.id')), 'commentsCount']
        ]
      },
      group: ['News.id', 'author.id'],
      order: [['createdAt', 'DESC']]
    });
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение последних новостей
exports.getLatestNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const news = await News.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получение одной новости
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });
    
    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }
    
    res.json(news);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Создание новости
exports.createNews = async (req, res) => {
  const { title, content } = req.body;
  
  try {
    const news = await News.create({
      title,
      content,
      authorId: req.user.id
    });
    
    const newsWithAuthor = await News.findByPk(news.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });
    
    res.status(201).json(newsWithAuthor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Обновление новости
exports.updateNews = async (req, res) => {
  const { title, content } = req.body;
  
  try {
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }
    
    // Проверка прав доступа
    if (news.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для редактирования' });
    }
    
    await news.update({ title, content });
    
    const updatedNews = await News.findByPk(news.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });
    
    res.json(updatedNews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Удаление новости
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }
    
    // Проверка прав доступа
    if (news.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав для удаления' });
    }
    
    await news.destroy();
    res.json({ message: 'Новость удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};