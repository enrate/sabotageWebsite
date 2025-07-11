'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.isBanned) {
      await queryInterface.addColumn('users', 'isBanned', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Флаг блокировки пользователя'
      });
    }
    if (!table.banReason) {
      await queryInterface.addColumn('users', 'banReason', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Причина блокировки пользователя'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'isBanned');
    await queryInterface.removeColumn('users', 'banReason');
  }
}; 