'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('users');
    if (!table.emailVerified) {
      await queryInterface.addColumn('users', 'emailVerified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Флаг подтверждения email'
      });
    }
    if (!table.emailVerificationToken) {
      await queryInterface.addColumn('users', 'emailVerificationToken', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Токен для подтверждения email'
      });
    }
    if (!table.emailVerificationExpires) {
      await queryInterface.addColumn('users', 'emailVerificationExpires', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Срок действия токена подтверждения email'
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'emailVerified');
    await queryInterface.removeColumn('users', 'emailVerificationToken');
    await queryInterface.removeColumn('users', 'emailVerificationExpires');
  }
}; 