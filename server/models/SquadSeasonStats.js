const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadSeasonStats = sequelize.define('SquadSeasonStats', {
    squadId: { type: DataTypes.INTEGER, allowNull: false },
    seasonId: { type: DataTypes.INTEGER, allowNull: false },
    kills: { type: DataTypes.INTEGER, defaultValue: 0 },
    deaths: { type: DataTypes.INTEGER, defaultValue: 0 },
    elo: { type: DataTypes.INTEGER, defaultValue: 1000 },
    matches: { type: DataTypes.INTEGER, defaultValue: 0 },
    wins: { type: DataTypes.INTEGER, defaultValue: 0 },
    losses: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'squad_season_stats',
    timestamps: false
  });
  return SquadSeasonStats;
}; 