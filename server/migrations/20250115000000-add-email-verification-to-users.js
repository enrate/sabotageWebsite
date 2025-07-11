'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'emailVerified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Флаг подтверждения email'
    });

    await queryInterface.addColumn('users', 'emailVerificationToken', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Токен для подтверждения email'
    });

    await queryInterface.addColumn('users', 'emailVerificationExpires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Срок действия токена подтверждения email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'emailVerified');
    await queryInterface.removeColumn('users', 'emailVerificationToken');
    await queryInterface.removeColumn('users', 'emailVerificationExpires');
  }
}; 