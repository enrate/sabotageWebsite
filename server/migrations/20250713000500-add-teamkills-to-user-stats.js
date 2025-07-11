module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('user_stats');
    if (!table.teamkills) {
      await queryInterface.addColumn('user_stats', 'teamkills', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_stats', 'teamkills');
  }
}; 