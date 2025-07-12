'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    
    // Добавляем поле twitchId
    if (!table.twitchId) {
      await queryInterface.addColumn('users', 'twitchId', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: 'Twitch ID пользователя'
      });
      
      // Добавляем уникальный индекс
      await queryInterface.addIndex('users', ['twitchId'], {
        unique: true,
        name: 'users_twitchid_unique',
        where: {
          twitchId: {
            [Sequelize.Op.ne]: null
          }
        }
      });
    }
    
    // Добавляем поле twitchUsername
    if (!table.twitchUsername) {
      await queryInterface.addColumn('users', 'twitchUsername', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Twitch username пользователя'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    
    // Удаляем поля Twitch
    if (table.twitchId) {
      await queryInterface.removeConstraint('users', 'users_twitchid_unique');
      await queryInterface.removeColumn('users', 'twitchId');
    }
    
    if (table.twitchUsername) {
      await queryInterface.removeColumn('users', 'twitchUsername');
    }
  }
}; 