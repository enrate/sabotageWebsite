"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('seasons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      trophy1Id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'awards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      trophy2Id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'awards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      trophy3Id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'awards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('seasons');
  }
}; 