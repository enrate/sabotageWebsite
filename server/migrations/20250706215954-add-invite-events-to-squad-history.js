"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем новые значения в ENUM только если их нет
    const enumType = 'enum_squad_history_eventType';
    const checkValue = async (val) => {
      const result = await queryInterface.sequelize.query(`SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = '${enumType}' AND e.enumlabel = '${val}'`);
      return result[0].length > 0;
    };
    if (!(await checkValue('invite'))) {
      await queryInterface.sequelize.query(`ALTER TYPE "${enumType}" ADD VALUE 'invite';`);
    }
    if (!(await checkValue('invite_accept'))) {
      await queryInterface.sequelize.query(`ALTER TYPE "${enumType}" ADD VALUE 'invite_accept';`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // В PostgreSQL нельзя удалить значения из ENUM, поэтому просто логируем
    console.log('Cannot remove ENUM values in PostgreSQL. Manual cleanup may be required.');
  }
};
