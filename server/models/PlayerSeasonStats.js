const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlayerSeasonStats = sequelize.define('PlayerSeasonStats', {
    userId: { type: DataTypes.INTEGER, allowNull: true },
    armaId: { type: DataTypes.STRING, allowNull: false },
    seasonId: { type: DataTypes.INTEGER, allowNull: false },
    kills: { type: DataTypes.INTEGER, defaultValue: 0 },
    deaths: { type: DataTypes.INTEGER, defaultValue: 0 },
    teamkills: { type: DataTypes.INTEGER, defaultValue: 0 },
    elo: { type: DataTypes.INTEGER, defaultValue: 1000 },
    matches: { type: DataTypes.INTEGER, defaultValue: 0 },
    wins: { type: DataTypes.INTEGER, defaultValue: 0 },
    losses: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'player_season_stats',
    timestamps: false
  });
  return PlayerSeasonStats;
}; 