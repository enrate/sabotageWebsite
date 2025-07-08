const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadStats = sequelize.define('SquadStats', {
    squadId: {
      type: DataTypes.INTEGER,
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
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'squad_stats',
    timestamps: false
  });
  return SquadStats;
}; 