module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('squad_season_stats');
    if (!table.teamkills) {
      await queryInterface.addColumn('squad_season_stats', 'teamkills', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('squad_season_stats', 'teamkills');
  }
}; 