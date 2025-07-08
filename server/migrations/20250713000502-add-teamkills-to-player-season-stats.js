module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('player_season_stats', 'teamkills', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('player_season_stats', 'teamkills');
  }
}; 