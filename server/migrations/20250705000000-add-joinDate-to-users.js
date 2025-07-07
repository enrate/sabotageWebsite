'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'joinDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Дата вступления пользователя в отряд'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'joinDate');
  }
}; 