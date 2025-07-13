'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'youtubeUrl', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Оригинальная ссылка на YouTube канал пользователя'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'youtubeUrl');
  }
}; 