"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('seasons');
    if (!table.awardsIssued) {
      await queryInterface.addColumn('seasons', 'awardsIssued', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('seasons', 'awardsIssued');
  }
}; 