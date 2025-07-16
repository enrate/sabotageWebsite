'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'adminToken', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Уникальный токен для входа в админ-панель'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'adminToken');
  }
}; 