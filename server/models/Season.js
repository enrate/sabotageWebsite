const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Season extends Model {
    static associate(models) {
      // Связи с наградами сезона
      Season.belongsTo(models.Award, { as: 'trophy1', foreignKey: 'trophy1Id' });
      Season.belongsTo(models.Award, { as: 'trophy2', foreignKey: 'trophy2Id' });
      Season.belongsTo(models.Award, { as: 'trophy3', foreignKey: 'trophy3Id' });

      // Связь с наградами сезона (новые)
      Season.hasMany(models.Award, { 
        as: 'seasonAwards', 
        foreignKey: 'seasonId' 
      });
    }

    // Метод для получения всех наград сезона
    async getSeasonAwards() {
      const { Award } = require('./index');
      return await Award.findAll({
        where: {
          seasonId: this.id,
          isSeasonAward: true,
          isActive: true
        },
        order: [['priority', 'DESC'], ['name', 'ASC']]
      });
    }

    // Метод для проверки, можно ли назначать награды
    canIssueAwards() {
      const now = new Date();
      return now >= this.endDate && !this.awardsIssued;
    }

    // Метод для автоматического назначения наград сезона
    async issueSeasonAwards() {
      if (this.awardsIssued) {
        throw new Error('Награды сезона уже были выданы');
      }

      const { User, UserAward } = require('./index');
      const seasonAwards = await this.getSeasonAwards();

      for (const award of seasonAwards) {
        // Получаем всех пользователей, которые соответствуют условиям
        const eligibleUsers = await this.getEligibleUsersForAward(award);
        
        for (const user of eligibleUsers) {
          // Проверяем, не получил ли пользователь уже эту награду
          const existingAward = await UserAward.findOne({
            where: {
              userId: user.id,
              awardId: award.id
            }
          });

          if (!existingAward && await award.canAssignToUser()) {
            await UserAward.create({
              userId: user.id,
              awardId: award.id,
              issuedBy: 1, // Системный пользователь для автоматических наград сезона
              issuedAt: new Date(),
              seasonId: this.id
            });
          }
        }
      }

      // Отмечаем, что награды выданы
      await this.update({ awardsIssued: true });
    }

    // Метод для получения пользователей, соответствующих условиям награды
    async getEligibleUsersForAward(award) {
      const { User } = require('./index');
      
      const whereClause = {
        // Пользователи, зарегистрированные до дедлайна (если указан)
        ...(award.registrationDeadline && {
          createdAt: {
            [sequelize.Op.lte]: award.registrationDeadline
          }
        })
      };

      const users = await User.findAll({ where: whereClause });

      // Фильтруем пользователей по условиям награды
      return users.filter(user => {
        if (award.minMatches && user.matches < award.minMatches) {
          return false;
        }

        if (award.minWins) {
          const wins = Math.floor(user.winrate * user.matches / 100);
          if (wins < award.minWins) return false;
        }

        if (award.minKills && user.kills < award.minKills) {
          return false;
        }

        if (award.minElo && user.elo < award.minElo) {
          return false;
        }

        return true;
      });
    }

    // Метод для получения статистики наград сезона
    async getAwardsStatistics() {
      const { UserAward } = require('./index');
      const seasonAwards = await this.getSeasonAwards();
      
      const stats = [];
      
      for (const award of seasonAwards) {
        const recipientsCount = await UserAward.count({
          where: { awardId: award.id }
        });

        stats.push({
          awardId: award.id,
          awardName: award.name,
          recipientsCount,
          maxRecipients: award.maxRecipients,
          isLimited: award.maxRecipients !== null
        });
      }

      return stats;
    }
  }

  Season.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Название сезона'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Дата начала сезона'
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Дата окончания сезона'
    },
    trophy1Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'awards',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID главной награды сезона'
    },
    trophy2Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'awards',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID второй награды сезона'
    },
    trophy3Id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'awards',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID третьей награды сезона'
    },
    awardsIssued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Были ли выданы награды сезона'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание сезона'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Активен ли сезон'
    },
    rules: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Правила сезона'
    }
  }, {
    sequelize,
    modelName: 'Season',
    tableName: 'seasons',
    timestamps: true,
    indexes: [
      {
        fields: ['startDate']
      },
      {
        fields: ['endDate']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  return Season;
}; 