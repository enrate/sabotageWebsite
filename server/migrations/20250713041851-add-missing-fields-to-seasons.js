'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем поля с проверкой существования
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'seasons' AND column_name = 'description'
        ) THEN
          ALTER TABLE "seasons" ADD COLUMN "description" TEXT;
          COMMENT ON COLUMN "seasons"."description" IS 'Описание сезона';
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'seasons' AND column_name = 'isActive'
        ) THEN
          ALTER TABLE "seasons" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
          COMMENT ON COLUMN "seasons"."isActive" IS 'Активен ли сезон';
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'seasons' AND column_name = 'rules'
        ) THEN
          ALTER TABLE "seasons" ADD COLUMN "rules" JSONB;
          COMMENT ON COLUMN "seasons"."rules" IS 'Правила сезона';
        END IF;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'seasons' AND column_name = 'awardsIssued'
        ) THEN
          ALTER TABLE "seasons" ADD COLUMN "awardsIssued" BOOLEAN NOT NULL DEFAULT false;
          COMMENT ON COLUMN "seasons"."awardsIssued" IS 'Были ли выданы награды сезона';
        END IF;
      END $$;
    `);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "seasons" DROP COLUMN IF EXISTS "description";
      ALTER TABLE "seasons" DROP COLUMN IF EXISTS "isActive";
      ALTER TABLE "seasons" DROP COLUMN IF EXISTS "rules";
      ALTER TABLE "seasons" DROP COLUMN IF EXISTS "awardsIssued";
    `);
  }
};
