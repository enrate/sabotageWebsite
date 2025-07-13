const { Award, User, UserAward, Season } = require('../models');

class AwardService {
  // Автоматическое назначение наград по условиям
  static async autoAssignAwardsByConditions() {
    try {
      console.log('🔄 Запуск автоматического назначения наград...');

      // Получаем все активные награды с автоматическим назначением
      const awards = await Award.findAll({
        where: {
          isActive: true,
          assignmentType: ['automatic', 'conditional']
        }
      });

      let totalAssigned = 0;
      const results = [];

      for (const award of awards) {
        console.log(`📋 Обработка награды: ${award.name}`);
        
        const result = await this.processAward(award);
        results.push(result);
        totalAssigned += result.assignedCount;
      }

      console.log(`✅ Автоматическое назначение завершено. Всего назначено: ${totalAssigned}`);
      
      return {
        success: true,
        totalAssigned,
        results
      };
    } catch (error) {
      console.error('❌ Ошибка при автоматическом назначении наград:', error);
      throw error;
    }
  }

  // Обработка одной награды
  static async processAward(award) {
    const result = {
      awardId: award.id,
      awardName: award.name,
      assignedCount: 0,
      errors: [],
      details: []
    };

    try {
      // Получаем всех пользователей
      const users = await User.findAll();

      for (const user of users) {
        try {
          // Проверяем, соответствует ли пользователь условиям
          const isEligible = await award.checkEligibility(user);
          
          if (isEligible) {
            // Проверяем, не получил ли пользователь уже эту награду
            const existingAward = await UserAward.findOne({
              where: { userId: user.id, awardId: award.id }
            });

            if (!existingAward && await award.canAssignToUser()) {
              await UserAward.create({
                userId: user.id,
                awardId: award.id,
                issuedBy: 1, // Системный пользователь для автоматических наград
                issuedAt: new Date(),
                seasonId: award.seasonId
              });

              result.assignedCount++;
              result.details.push({
                userId: user.id,
                username: user.username,
                assigned: true
              });
            } else {
              result.details.push({
                userId: user.id,
                username: user.username,
                assigned: false,
                reason: existingAward ? 'Уже получена' : 'Достигнут лимит'
              });
            }
          } else {
            result.details.push({
              userId: user.id,
              username: user.username,
              assigned: false,
              reason: 'Не соответствует условиям'
            });
          }
        } catch (userError) {
          result.errors.push({
            userId: user.id,
            username: user.username,
            error: userError.message
          });
        }
      }
    } catch (error) {
      result.errors.push({
        error: error.message
      });
    }

    return result;
  }

  // Проверка и назначение наград для новых пользователей
  static async checkNewUserAwards(user) {
    try {
      console.log(`🔍 Проверка наград для нового пользователя: ${user.username}`);

      // Получаем все активные награды с автоматическим назначением
      const awards = await Award.findAll({
        where: {
          isActive: true,
          assignmentType: ['automatic', 'conditional']
        }
      });

      let assignedCount = 0;

      for (const award of awards) {
        try {
          // Проверяем, соответствует ли пользователь условиям
          const isEligible = await award.checkEligibility(user);
          
          if (isEligible) {
            // Проверяем, не получил ли пользователь уже эту награду
            const existingAward = await UserAward.findOne({
              where: { userId: user.id, awardId: award.id }
            });

            if (!existingAward && await award.canAssignToUser()) {
              await UserAward.create({
                userId: user.id,
                awardId: award.id,
                issuedBy: 1, // Системный пользователь для автоматических наград
                issuedAt: new Date(),
                seasonId: award.seasonId
              });

              assignedCount++;
              console.log(`🎖️  Пользователю ${user.username} назначена награда: ${award.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при проверке награды ${award.name} для пользователя ${user.username}:`, error);
        }
      }

      return assignedCount;
    } catch (error) {
      console.error('❌ Ошибка при проверке наград для нового пользователя:', error);
      throw error;
    }
  }

  // Проверка и назначение наград при обновлении статистики пользователя
  static async checkUserStatsAwards(user) {
    try {
      console.log(`📊 Проверка наград по статистике для пользователя: ${user.username}`);

      // Получаем награды, которые зависят от статистики
      const { Op } = require('sequelize');
      const awards = await Award.findAll({
        where: {
          isActive: true,
          assignmentType: ['automatic', 'conditional'],
          [Op.or]: [
            { minMatches: { [Op.ne]: null } },
            { minWins: { [Op.ne]: null } },
            { minKills: { [Op.ne]: null } },
            { minElo: { [Op.ne]: null } }
          ]
      });

      let assignedCount = 0;

      for (const award of awards) {
        try {
          // Проверяем, соответствует ли пользователь условиям
          const isEligible = await award.checkEligibility(user);
          
          if (isEligible) {
            // Проверяем, не получил ли пользователь уже эту награду
            const existingAward = await UserAward.findOne({
              where: { userId: user.id, awardId: award.id }
            });

            if (!existingAward && await award.canAssignToUser()) {
              await UserAward.create({
                userId: user.id,
                awardId: award.id,
                issuedBy: 1, // Системный пользователь для автоматических наград
                issuedAt: new Date(),
                seasonId: award.seasonId
              });

              assignedCount++;
              console.log(`🏆 Пользователю ${user.username} назначена награда за достижения: ${award.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Ошибка при проверке награды ${award.name} для пользователя ${user.username}:`, error);
        }
      }

      return assignedCount;
    } catch (error) {
      console.error('❌ Ошибка при проверке наград по статистике:', error);
      throw error;
    }
  }

  // Создание награды для ранних регистрантов
  static async createEarlyRegistrationAward(seasonId, deadline, description = null) {
    try {
      const season = await Season.findByPk(seasonId);
      if (!season) {
        throw new Error('Сезон не найден');
      }

      const award = await Award.create({
        type: 'early_registration',
        name: `Ранний регистрант - ${season.name}`,
        description: description || `Награда для игроков, зарегистрированных до ${new Date(deadline).toLocaleDateString()}`,
        category: 'season',
        isSeasonAward: true,
        assignmentType: 'automatic',
        registrationDeadline: new Date(deadline),
        seasonId: seasonId,
        priority: 10
      });

      console.log(`✅ Создана награда для ранних регистрантов: ${award.name}`);
      return award;
    } catch (error) {
      console.error('❌ Ошибка при создании награды для ранних регистрантов:', error);
      throw error;
    }
  }

  // Создание награды за количество матчей
  static async createMatchesAward(seasonId, minMatches, description = null) {
    try {
      const season = await Season.findByPk(seasonId);
      if (!season) {
        throw new Error('Сезон не найден');
      }

      const award = await Award.create({
        type: 'matches_achievement',
        name: `Игрок сезона - ${minMatches}+ матчей`,
        description: description || `Награда за участие в ${minMatches} или более матчах в сезоне ${season.name}`,
        category: 'season',
        isSeasonAward: true,
        assignmentType: 'automatic',
        minMatches: minMatches,
        seasonId: seasonId,
        priority: 5
      });

      console.log(`✅ Создана награда за матчи: ${award.name}`);
      return award;
    } catch (error) {
      console.error('❌ Ошибка при создании награды за матчи:', error);
      throw error;
    }
  }

  // Создание награды за количество побед
  static async createWinsAward(seasonId, minWins, description = null) {
    try {
      const season = await Season.findByPk(seasonId);
      if (!season) {
        throw new Error('Сезон не найден');
      }

      const award = await Award.create({
        type: 'wins_achievement',
        name: `Победитель сезона - ${minWins}+ побед`,
        description: description || `Награда за ${minWins} или более побед в сезоне ${season.name}`,
        category: 'season',
        isSeasonAward: true,
        assignmentType: 'automatic',
        minWins: minWins,
        seasonId: seasonId,
        priority: 8
      });

      console.log(`✅ Создана награда за победы: ${award.name}`);
      return award;
    } catch (error) {
      console.error('❌ Ошибка при создании награды за победы:', error);
      throw error;
    }
  }

  // Создание награды за рейтинг ELO
  static async createEloAward(seasonId, minElo, description = null) {
    try {
      const season = await Season.findByPk(seasonId);
      if (!season) {
        throw new Error('Сезон не найден');
      }

      const award = await Award.create({
        type: 'elo_achievement',
        name: `Элитный игрок - ${minElo}+ ELO`,
        description: description || `Награда за достижение рейтинга ${minElo} или выше в сезоне ${season.name}`,
        category: 'season',
        isSeasonAward: true,
        assignmentType: 'automatic',
        minElo: minElo,
        seasonId: seasonId,
        priority: 9
      });

      console.log(`✅ Создана награда за ELO: ${award.name}`);
      return award;
    } catch (error) {
      console.error('❌ Ошибка при создании награды за ELO:', error);
      throw error;
    }
  }

  // Получение статистики наград
  static async getAwardsStatistics() {
    try {
      const awards = await Award.findAll({
        where: { isActive: true },
        include: [
          {
            model: Season,
            as: 'season',
            attributes: ['id', 'name']
          }
        ]
      });

      const stats = [];

      for (const award of awards) {
        const recipientsCount = await UserAward.count({
          where: { awardId: award.id }
        });

        stats.push({
          id: award.id,
          name: award.name,
          category: award.category,
          assignmentType: award.assignmentType,
          recipientsCount,
          maxRecipients: award.maxRecipients,
          isLimited: award.maxRecipients !== null,
          season: award.season ? award.season.name : null
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Ошибка при получении статистики наград:', error);
      throw error;
    }
  }
}

module.exports = AwardService; 