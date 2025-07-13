'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем новые поля в таблицу awards с проверкой существования
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        -- Добавляем ENUM тип если не существует
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_awards_category') THEN
          CREATE TYPE "public"."enum_awards_category" AS ENUM('general', 'season', 'achievement', 'special');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_awards_assignmenttype') THEN
          CREATE TYPE "public"."enum_awards_assignmenttype" AS ENUM('manual', 'automatic', 'conditional');
        END IF;
      END $$;
    `);

    // Добавляем поля с проверкой существования
    const columns = [
      {
        name: 'category',
        type: '"enum_awards_category"',
        comment: 'Категория награды'
      },
      {
        name: 'isSeasonAward',
        type: 'BOOLEAN',
        defaultValue: false,
        comment: 'Является ли наградой сезона'
      },
      {
        name: 'assignmentType',
        type: '"enum_awards_assignmenttype"',
        comment: 'Тип назначения награды'
      },
      {
        name: 'assignmentConditions',
        type: 'JSONB',
        comment: 'Условия автоматического назначения награды'
      },
      {
        name: 'registrationDeadline',
        type: 'DATE',
        comment: 'Дедлайн регистрации для получения награды'
      },
      {
        name: 'minMatches',
        type: 'INTEGER',
        comment: 'Минимальное количество матчей для получения награды'
      },
      {
        name: 'minWins',
        type: 'INTEGER',
        comment: 'Минимальное количество побед для получения награды'
      },
      {
        name: 'minKills',
        type: 'INTEGER',
        comment: 'Минимальное количество убийств для получения награды'
      },
      {
        name: 'minElo',
        type: 'INTEGER',
        comment: 'Минимальный рейтинг ELO для получения награды'
      },
      {
        name: 'seasonId',
        type: 'INTEGER',
        comment: 'ID сезона для наград сезона'
      },
      {
        name: 'isActive',
        type: 'BOOLEAN',
        defaultValue: true,
        comment: 'Активна ли награда'
      },
      {
        name: 'maxRecipients',
        type: 'INTEGER',
        comment: 'Максимальное количество получателей награды'
      },
      {
        name: 'priority',
        type: 'INTEGER',
        defaultValue: 0,
        comment: 'Приоритет награды (для сортировки)'
      }
    ];

    for (const column of columns) {
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'awards' AND column_name = '${column.name}'
          ) THEN
            ALTER TABLE "awards" ADD COLUMN "${column.name}" ${column.type} ${column.defaultValue ? `NOT NULL DEFAULT ${column.defaultValue}` : ''};
            COMMENT ON COLUMN "awards"."${column.name}" IS '${column.comment}';
          END IF;
        END $$;
      `);
    }

    // Добавляем внешний ключ для seasonId если не существует
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'awards_seasonId_fkey'
        ) THEN
          ALTER TABLE "awards" ADD CONSTRAINT "awards_seasonId_fkey" 
          FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Добавляем индексы если не существуют
    const indexes = ['category', 'isSeasonAward', 'assignmentType', 'seasonId', 'isActive', 'priority'];
    for (const index of indexes) {
      await queryInterface.sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes WHERE indexname = 'awards_${index}_idx'
          ) THEN
            CREATE INDEX "awards_${index}_idx" ON "awards" ("${index}");
          END IF;
        END $$;
      `);
    }

    // Обновляем существующие награды с значениями по умолчанию
    await queryInterface.sequelize.query(`
      UPDATE awards 
      SET category = 'general', 
          "assignmentType" = 'manual',
          "isActive" = true,
          priority = 0
      WHERE category IS NULL OR "assignmentType" IS NULL OR "isActive" IS NULL OR priority IS NULL
    `);

    // Делаем обязательные поля NOT NULL после установки значений по умолчанию
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        -- Проверяем, что все записи имеют значения для обязательных полей
        IF NOT EXISTS (
          SELECT 1 FROM awards 
          WHERE category IS NULL OR "assignmentType" IS NULL OR "isActive" IS NULL OR priority IS NULL
        ) THEN
          -- Делаем поля NOT NULL
          ALTER TABLE "awards" ALTER COLUMN "category" SET NOT NULL;
          ALTER TABLE "awards" ALTER COLUMN "assignmentType" SET NOT NULL;
          ALTER TABLE "awards" ALTER COLUMN "isActive" SET NOT NULL;
          ALTER TABLE "awards" ALTER COLUMN "priority" SET NOT NULL;
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем индексы
    const indexes = ['category', 'isSeasonAward', 'assignmentType', 'seasonId', 'isActive', 'priority'];
    for (const index of indexes) {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "awards_${index}_idx";
      `);
    }

    // Удаляем внешний ключ
    await queryInterface.sequelize.query(`
      ALTER TABLE "awards" DROP CONSTRAINT IF EXISTS "awards_seasonId_fkey";
    `);

    // Удаляем колонки
    const columns = [
      'priority', 'maxRecipients', 'isActive', 'seasonId', 'minElo', 
      'minKills', 'minWins', 'minMatches', 'registrationDeadline', 
      'assignmentConditions', 'assignmentType', 'isSeasonAward', 'category'
    ];
    
    for (const column of columns) {
      await queryInterface.sequelize.query(`
        ALTER TABLE "awards" DROP COLUMN IF EXISTS "${column}";
      `);
    }

    // Удаляем ENUM типы
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_awards_category;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_awards_assignmenttype;');
  }
}; 