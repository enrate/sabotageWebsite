'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поле activeAwardId с проверкой существования
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'activeAwardId'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "activeAwardId" INTEGER;
          COMMENT ON COLUMN "users"."activeAwardId" IS 'ID активной награды пользователя для отображения в профиле';
        END IF;
      END $$;
    `);

    // Добавляем внешний ключ для activeAwardId если не существует
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'users_activeAwardId_fkey'
        ) THEN
          ALTER TABLE "users" ADD CONSTRAINT "users_activeAwardId_fkey" 
          FOREIGN KEY ("activeAwardId") REFERENCES "awards"("id") ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Добавляем индекс если не существует
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'users_activeAwardId_idx'
        ) THEN
          CREATE INDEX "users_activeAwardId_idx" ON "users" ("activeAwardId");
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем индекс
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "users_activeAwardId_idx";
    `);

    // Удаляем внешний ключ
    await queryInterface.sequelize.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_activeAwardId_fkey";
    `);

    // Удаляем колонку
    await queryInterface.sequelize.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "activeAwardId";
    `);
  }
}; 