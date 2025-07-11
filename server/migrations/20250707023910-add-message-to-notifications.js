'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('notifications');
    if (!table.message) {
      await queryInterface.addColumn('notifications', 'message', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifications', 'message');
  }
};
