const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadHistory = sequelize.define('SquadHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    squadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'squads',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    eventType: {
      type: DataTypes.ENUM('join', 'leave', 'kick', 'promote', 'demote', 'warning', 'warning_cancel'),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'squad_history',
    timestamps: true
  });

  SquadHistory.associate = (models) => {
    // Связь с отрядом
    SquadHistory.belongsTo(models.Squad, {
      foreignKey: 'squadId',
      as: 'squad'
    });

    // Связь с пользователем
    SquadHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return SquadHistory;
}; 