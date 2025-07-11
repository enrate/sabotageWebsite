'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.elo) {
      await queryInterface.addColumn('users', 'elo', { type: Sequelize.INTEGER, defaultValue: 1000 });
    }
    if (!table.kills) {
      await queryInterface.addColumn('users', 'kills', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!table.deaths) {
      await queryInterface.addColumn('users', 'deaths', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!table.teamkills) {
      await queryInterface.addColumn('users', 'teamkills', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
    if (!table.winrate) {
      await queryInterface.addColumn('users', 'winrate', { type: Sequelize.FLOAT, defaultValue: 0 });
    }
    if (!table.matches) {
      await queryInterface.addColumn('users', 'matches', { type: Sequelize.INTEGER, defaultValue: 0 });
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'elo');
    await queryInterface.removeColumn('users', 'kills');
    await queryInterface.removeColumn('users', 'deaths');
    await queryInterface.removeColumn('users', 'teamkills');
    await queryInterface.removeColumn('users', 'winrate');
    await queryInterface.removeColumn('users', 'matches');
  }
}; 