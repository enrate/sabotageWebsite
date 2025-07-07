const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const News = sequelize.define('News', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'news',
    timestamps: true
  });

  News.associate = (models) => {
    // Связь с автором новости
    News.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
    // Связь с комментариями
    News.hasMany(models.Comment, {
      foreignKey: 'newsId',
      as: 'comments'
    });
  };

  return News;
};