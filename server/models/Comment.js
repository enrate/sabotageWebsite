const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000] // Максимум 1000 символов
      }
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'news',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      }
    }
  }, {
    tableName: 'comments',
    timestamps: true
  });

  Comment.associate = (models) => {
    // Связь с новостью
    Comment.belongsTo(models.News, {
      foreignKey: 'newsId',
      as: 'news'
    });

    // Связь с пользователем
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Связь с родительским комментарием (для ответов)
    Comment.belongsTo(models.Comment, {
      foreignKey: 'parentId',
      as: 'parent'
    });

    // Связь с дочерними комментариями
    Comment.hasMany(models.Comment, {
      foreignKey: 'parentId',
      as: 'replies'
    });
  };

  return Comment;
}; 