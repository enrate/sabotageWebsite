module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('player_season_stats', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      userId: { type: Sequelize.INTEGER, allowNull: false },
      armaId: { type: Sequelize.STRING, allowNull: false },
      seasonId: { type: Sequelize.INTEGER, allowNull: false },
      kills: { type: Sequelize.INTEGER, defaultValue: 0 },
      deaths: { type: Sequelize.INTEGER, defaultValue: 0 },
      teamkills: { type: Sequelize.INTEGER, defaultValue: 0 },
      elo: { type: Sequelize.INTEGER, defaultValue: 1000 },
      matches: { type: Sequelize.INTEGER, defaultValue: 0 },
      wins: { type: Sequelize.INTEGER, defaultValue: 0 },
      losses: { type: Sequelize.INTEGER, defaultValue: 0 },
      lastUpdated: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('player_season_stats');
  }
}; 