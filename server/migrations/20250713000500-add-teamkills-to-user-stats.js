module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user_stats', 'teamkills', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_stats', 'teamkills');
  }
}; 