const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Award extends Model {
    static associate(models) {
      // Связь с сезоном
      Award.belongsTo(models.Season, { 
        as: 'season', 
        foreignKey: 'seasonId' 
      });

      // Связи с пользователями через UserAward
      Award.hasMany(models.UserAward, { 
        as: 'userAwards', 
        foreignKey: 'awardId' 
      });

      // Связи с отрядами через SquadAward
      Award.hasMany(models.SquadAward, { 
        as: 'squadAwards', 
        foreignKey: 'awardId' 
      });
    }

    // Метод для проверки условий получения награды
    async checkEligibility(user) {
      if (!this.isActive) return false;

      switch (this.assignmentType) {
        case 'manual':
          return false; // Ручное назначение
          
        case 'automatic':
          return this.checkAutomaticConditions(user);
          
        case 'conditional':
          return this.checkConditionalConditions(user);
          
        default:
          return false;
      }
    }

    // Проверка условий для автоматического назначения
    checkAutomaticConditions(user) {
      if (this.registrationDeadline && user.createdAt > this.registrationDeadline) {
        return false;
      }

      if (this.minMatches && user.matches < this.minMatches) {
        return false;
      }

      if (this.minWins && user.winrate * user.matches / 100 < this.minWins) {
        return false;
      }

      if (this.minKills && user.kills < this.minKills) {
        return false;
      }

      if (this.minElo && user.elo < this.minElo) {
        return false;
      }

      return true;
    }

    // Проверка условий для условного назначения
    checkConditionalConditions(user) {
      if (!this.assignmentConditions) return false;

      const conditions = this.assignmentConditions;

      // Проверка дедлайна регистрации
      if (conditions.registrationDeadline && user.createdAt > new Date(conditions.registrationDeadline)) {
        return false;
      }

      // Проверка минимального количества матчей
      if (conditions.minMatches && user.matches < conditions.minMatches) {
        return false;
      }

      // Проверка минимального количества побед
      if (conditions.minWins) {
        const wins = Math.floor(user.winrate * user.matches / 100);
        if (wins < conditions.minWins) return false;
      }

      // Проверка минимального количества убийств
      if (conditions.minKills && user.kills < conditions.minKills) {
        return false;
      }

      // Проверка минимального рейтинга ELO
      if (conditions.minElo && user.elo < conditions.minElo) {
        return false;
      }

      // Проверка принадлежности к отряду
      if (conditions.requireSquad && !user.squadId) {
        return false;
      }

      // Проверка роли пользователя
      if (conditions.requiredRoles && !conditions.requiredRoles.includes(user.role)) {
        return false;
      }

      return true;
    }

    // Метод для получения количества текущих получателей
    async getRecipientsCount() {
      const { UserAward } = require('./index');
      return await UserAward.count({ where: { awardId: this.id } });
    }

    // Проверка лимита получателей
    async canAssignToUser() {
      if (!this.maxRecipients) return true;
      
      const currentCount = await this.getRecipientsCount();
      return currentCount < this.maxRecipients;
    }
  }

  Award.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Тип награды'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Название награды'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание награды'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Путь к изображению награды'
    },
    category: {
      type: DataTypes.ENUM('general', 'season', 'achievement', 'special'),
      allowNull: false,
      defaultValue: 'general',
      comment: 'Категория награды'
    },
    isSeasonAward: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Является ли наградой сезона'
    },
    assignmentType: {
      type: DataTypes.ENUM('manual', 'automatic', 'conditional'),
      allowNull: false,
      defaultValue: 'manual',
      comment: 'Тип назначения награды'
    },
    assignmentConditions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Условия автоматического назначения награды'
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дедлайн регистрации для получения награды'
    },
    minMatches: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Минимальное количество матчей для получения награды'
    },
    minWins: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Минимальное количество побед для получения награды'
    },
    minKills: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Минимальное количество убийств для получения награды'
    },
    minElo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Минимальный рейтинг ELO для получения награды'
    },
    seasonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'seasons',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID сезона для наград сезона'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Активна ли награда'
    },
    maxRecipients: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Максимальное количество получателей награды'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Приоритет награды (для сортировки)'
    }
  }, {
    sequelize,
    modelName: 'Award',
    tableName: 'awards',
    timestamps: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['isSeasonAward']
      },
      {
        fields: ['assignmentType']
      },
      {
        fields: ['seasonId']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['priority']
      }
    ]
  });

  return Award;
}; 