'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'elo', { type: Sequelize.INTEGER, defaultValue: 1000 });
    await queryInterface.addColumn('users', 'kills', { type: Sequelize.INTEGER, defaultValue: 0 });
    await queryInterface.addColumn('users', 'deaths', { type: Sequelize.INTEGER, defaultValue: 0 });
    await queryInterface.addColumn('users', 'teamkills', { type: Sequelize.INTEGER, defaultValue: 0 });
    await queryInterface.addColumn('users', 'winrate', { type: Sequelize.FLOAT, defaultValue: 0 });
    await queryInterface.addColumn('users', 'matches', { type: Sequelize.INTEGER, defaultValue: 0 });
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