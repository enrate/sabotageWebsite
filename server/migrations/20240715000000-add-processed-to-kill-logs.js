"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('kill_logs', 'processed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('kill_logs', 'processed');
  }
}; 