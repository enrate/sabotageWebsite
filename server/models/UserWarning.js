const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserWarning = sequelize.define('UserWarning', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    },
    canceledBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_warnings',
    timestamps: true
  });

  UserWarning.associate = (models) => {
    // Связь с пользователем
    UserWarning.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    // Связь с администратором
    UserWarning.belongsTo(models.User, {
      foreignKey: 'adminId',
      as: 'admin'
    });
    UserWarning.belongsTo(models.User, {
      foreignKey: 'canceledBy',
      as: 'canceledByAdmin'
    });
  };

  return UserWarning;
}; 