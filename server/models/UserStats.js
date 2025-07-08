const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserStats = sequelize.define('UserStats', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    armaId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    kills: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deaths: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    teamkills: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_stats',
    timestamps: false
  });
  return UserStats;
}; 