const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadWarning = sequelize.define('SquadWarning', {
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
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'squad_warnings',
    timestamps: true
  });

  SquadWarning.associate = (models) => {
    // Связь с отрядом
    SquadWarning.belongsTo(models.Squad, {
      foreignKey: 'squadId',
      as: 'squad'
    });

    // Связь с администратором
    SquadWarning.belongsTo(models.User, {
      foreignKey: 'adminId',
      as: 'admin'
    });
  };

  return SquadWarning;
}; 