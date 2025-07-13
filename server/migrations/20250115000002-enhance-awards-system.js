'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем новые поля в таблицу awards
    await queryInterface.addColumn('awards', 'category', {
      type: Sequelize.ENUM('general', 'season', 'achievement', 'special'),
      allowNull: false,
      defaultValue: 'general',
      comment: 'Категория награды'
    });

    await queryInterface.addColumn('awards', 'isSeasonAward', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Является ли наградой сезона'
    });

    await queryInterface.addColumn('awards', 'assignmentType', {
      type: Sequelize.ENUM('manual', 'automatic', 'conditional'),
      allowNull: false,
      defaultValue: 'manual',
      comment: 'Тип назначения награды'
    });

    await queryInterface.addColumn('awards', 'assignmentConditions', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Условия автоматического назначения награды'
    });

    await queryInterface.addColumn('awards', 'registrationDeadline', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Дедлайн регистрации для получения награды'
    });

    await queryInterface.addColumn('awards', 'minMatches', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Минимальное количество матчей для получения награды'
    });

    await queryInterface.addColumn('awards', 'minWins', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Минимальное количество побед для получения награды'
    });

    await queryInterface.addColumn('awards', 'minKills', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Минимальное количество убийств для получения награды'
    });

    await queryInterface.addColumn('awards', 'minElo', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Минимальный рейтинг ELO для получения награды'
    });

    await queryInterface.addColumn('awards', 'seasonId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'seasons',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID сезона для наград сезона'
    });

    await queryInterface.addColumn('awards', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Активна ли награда'
    });

    await queryInterface.addColumn('awards', 'maxRecipients', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Максимальное количество получателей награды'
    });

    await queryInterface.addColumn('awards', 'priority', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Приоритет награды (для сортировки)'
    });

    // Добавляем индексы для оптимизации
    await queryInterface.addIndex('awards', ['category']);
    await queryInterface.addIndex('awards', ['isSeasonAward']);
    await queryInterface.addIndex('awards', ['assignmentType']);
    await queryInterface.addIndex('awards', ['seasonId']);
    await queryInterface.addIndex('awards', ['isActive']);
    await queryInterface.addIndex('awards', ['priority']);

    // Обновляем существующие награды
    await queryInterface.sequelize.query(`
      UPDATE awards 
      SET category = 'general', 
          "assignmentType" = 'manual',
          "isActive" = true,
          priority = 0
      WHERE category IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем индексы
    await queryInterface.removeIndex('awards', ['category']);
    await queryInterface.removeIndex('awards', ['isSeasonAward']);
    await queryInterface.removeIndex('awards', ['assignmentType']);
    await queryInterface.removeIndex('awards', ['seasonId']);
    await queryInterface.removeIndex('awards', ['isActive']);
    await queryInterface.removeIndex('awards', ['priority']);

    // Удаляем колонки
    await queryInterface.removeColumn('awards', 'priority');
    await queryInterface.removeColumn('awards', 'maxRecipients');
    await queryInterface.removeColumn('awards', 'isActive');
    await queryInterface.removeColumn('awards', 'seasonId');
    await queryInterface.removeColumn('awards', 'minElo');
    await queryInterface.removeColumn('awards', 'minKills');
    await queryInterface.removeColumn('awards', 'minWins');
    await queryInterface.removeColumn('awards', 'minMatches');
    await queryInterface.removeColumn('awards', 'registrationDeadline');
    await queryInterface.removeColumn('awards', 'assignmentConditions');
    await queryInterface.removeColumn('awards', 'assignmentType');
    await queryInterface.removeColumn('awards', 'isSeasonAward');
    await queryInterface.removeColumn('awards', 'category');

    // Удаляем ENUM типы
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_awards_category;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_awards_assignmentType;');
  }
}; 