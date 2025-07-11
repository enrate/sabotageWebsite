'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Проверка наличия столбца canceledBy
    const table = await queryInterface.describeTable('user_warnings');
    if (!table.canceledBy) {
      await queryInterface.addColumn('user_warnings', 'canceledBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
    if (!table.canceledAt) {
      await queryInterface.addColumn('user_warnings', 'canceledAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_warnings', 'canceledBy');
    await queryInterface.removeColumn('user_warnings', 'canceledAt');
  }
};
