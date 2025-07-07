"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('squad_awards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      squadId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      awardId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      issuedBy: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      issuedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('squad_awards');
  }
}; 