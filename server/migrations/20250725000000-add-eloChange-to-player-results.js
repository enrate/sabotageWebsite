'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('player_results', 'eloChange', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Изменение эло за матч'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('player_results', 'eloChange');
  }
}; 