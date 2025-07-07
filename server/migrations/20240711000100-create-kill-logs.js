"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("kill_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      friendlyFire: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      suicide: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      killerIdentity: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      victimIdentity: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("kill_logs");
  },
}; 