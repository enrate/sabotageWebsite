'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'armaId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Arma ID пользователя (UUID)'
    });

    await queryInterface.addColumn('users', 'isLookingForSquad', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Флаг поиска отряда пользователем'
    });

    // Добавляем уникальный индекс для armaId отдельно
    await queryInterface.addIndex('users', ['armaId'], {
      unique: true,
      where: {
        armaId: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', ['armaId']);
    await queryInterface.removeColumn('users', 'armaId');
    await queryInterface.removeColumn('users', 'isLookingForSquad');
  }
}; 