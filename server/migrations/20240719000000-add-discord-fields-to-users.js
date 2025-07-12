'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.discordId) {
      await queryInterface.addColumn('users', 'discordId', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Discord ID пользователя'
      });
      await queryInterface.addConstraint('users', {
        fields: ['discordId'],
        type: 'unique',
        name: 'users_discordid_unique'
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
    const table = await queryInterface.describeTable('users');
    if (table.discordId) {
      await queryInterface.removeConstraint('users', 'users_discordid_unique');
      await queryInterface.removeColumn('users', 'discordId');
    }
    if (table.discordUsername) {
      await queryInterface.removeColumn('users', 'discordUsername');
    }
  }
}; 