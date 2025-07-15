'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'passwordResetToken', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Токен для сброса пароля'
    });
    await queryInterface.addColumn('users', 'passwordResetExpires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Срок действия токена сброса пароля'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'passwordResetToken');
    await queryInterface.removeColumn('users', 'passwordResetExpires');
  }
}; 