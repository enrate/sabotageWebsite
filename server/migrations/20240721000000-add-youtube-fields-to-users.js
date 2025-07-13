'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    
    // Добавляем поле youtubeId
    if (!table.youtubeId) {
      await queryInterface.addColumn('users', 'youtubeId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: 'YouTube ID пользователя'
      });
      
      // Добавляем уникальный индекс
      await queryInterface.addIndex('users', ['youtubeId'], {
        unique: true,
        name: 'users_youtubeid_unique',
        where: {
          youtubeId: {
            [Sequelize.Op.ne]: null
          }
        }
      });
    }
    
    // Добавляем поле youtubeUsername
    if (!table.youtubeUsername) {
      await queryInterface.addColumn('users', 'youtubeUsername', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'YouTube username пользователя'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    
    // Удаляем поля YouTube
    if (table.youtubeId) {
      await queryInterface.removeConstraint('users', 'users_youtubeid_unique');
      await queryInterface.removeColumn('users', 'youtubeId');
    }
    
    if (table.youtubeUsername) {
      await queryInterface.removeColumn('users', 'youtubeUsername');
    }
  }
}; 