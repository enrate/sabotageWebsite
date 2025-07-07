'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('squad_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      squadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'squads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      eventType: {
        type: Sequelize.ENUM('join', 'leave', 'kick', 'promote', 'demote', 'warning', 'warning_cancel', 'invite', 'invite_accept'),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем индексы для оптимизации
    await queryInterface.addIndex('squad_history', ['squadId']);
    await queryInterface.addIndex('squad_history', ['userId']);
    await queryInterface.addIndex('squad_history', ['eventType']);
    await queryInterface.addIndex('squad_history', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('squad_history');
  }
}; 