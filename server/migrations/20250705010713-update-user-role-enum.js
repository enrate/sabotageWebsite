'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Обновляем ENUM для поля role, добавляя новые значения
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'admin', 'member', 'deputy'),
      defaultValue: 'user'
    });
  },

  async down (queryInterface, Sequelize) {
    // Возвращаем к исходному состоянию
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'admin'),
      defaultValue: 'user'
    });
  }
};
