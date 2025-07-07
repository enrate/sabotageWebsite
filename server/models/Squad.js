const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Squad = sequelize.define('Squad', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50]
      }
    },
    tag: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [2, 20]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo: {
      type: DataTypes.TEXT,
      allowNull: true // URL логотипа или base64 data
    },
    performance: {
      type: DataTypes.JSONB,
      allowNull: true // Результативность по сезонам
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: true // Общая статистика отряда
    },
    leaderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 1,
        max: 100
      }
    },
    isJoinRequestOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'squads',
    timestamps: true
  });

  Squad.associate = (models) => {
    // Связь с лидером отряда
    Squad.belongsTo(models.User, {
      foreignKey: 'leaderId',
      as: 'leader'
    });

    // Один отряд — много пользователей
    Squad.hasMany(models.User, {
      foreignKey: 'squadId',
      as: 'members'
    });

    // Один отряд — много записей истории
    Squad.hasMany(models.SquadHistory, {
      foreignKey: 'squadId',
      as: 'history'
    });
  };

  return Squad;
};