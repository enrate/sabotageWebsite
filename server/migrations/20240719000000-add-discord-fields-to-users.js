'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.discordId) {
      await queryInterface.addColumn('users', 'discordId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: 'Discord ID пользователя'
      });
    }
    if (!table.discordUsername) {
      await queryInterface.addColumn('users', 'discordUsername', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Discord username пользователя'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'discordId');
    await queryInterface.removeColumn('users', 'discordUsername');
  }
}; 