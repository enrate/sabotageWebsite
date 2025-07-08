"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем новые значения в ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_squad_history_eventType" ADD VALUE 'invite';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_squad_history_eventType" ADD VALUE 'invite_accept';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // В PostgreSQL нельзя удалить значения из ENUM, поэтому просто логируем
    console.log('Cannot remove ENUM values in PostgreSQL. Manual cleanup may be required.');
  }
};
