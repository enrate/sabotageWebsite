const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    avatar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    squadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'squads',
        key: 'id'
      }
    },
    joinDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата вступления пользователя в отряд'
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'member', 'deputy'),
      defaultValue: 'user'
    },
    armaId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Arma ID пользователя (UUID)'
    },
    isLookingForSquad: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Флаг поиска отряда пользователем'
    },
    elo: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    },
    kills: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deaths: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    teamkills: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    winrate: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    matches: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Флаг блокировки пользователя'
    },
    banReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Причина блокировки пользователя'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Флаг подтверждения email'
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Токен для подтверждения email'
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Срок действия токена подтверждения email'
    },
    discordId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Discord ID пользователя'
    },
    discordUsername: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Discord username пользователя'
    },
    twitchId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Twitch ID пользователя'
    },
    twitchUsername: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Twitch username пользователя'
    },
    youtubeId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'YouTube ID пользователя'
    },
    youtubeUsername: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'YouTube username пользователя'
    },
    youtubeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Оригинальная ссылка на YouTube канал пользователя'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['armaId'],
        where: {
          armaId: {
            [require('sequelize').Op.ne]: null
          }
        }
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.associate = (models) => {
    // Связь с новостями (один ко многим)
    User.hasMany(models.News, {
      foreignKey: 'authorId',
      as: 'news'
    });

    // Связь с отрядами, где пользователь является лидером
    User.hasMany(models.Squad, {
      foreignKey: 'leaderId',
      as: 'ledSquads'
    });

    // Один пользователь — один отряд
    User.belongsTo(models.Squad, {
      foreignKey: 'squadId',
      as: 'squad'
    });

    // Связь с отправленными сообщениями
    User.hasMany(models.Message, {
      foreignKey: 'senderId',
      as: 'sentMessages'
    });

    // Связь с полученными сообщениями
    User.hasMany(models.Message, {
      foreignKey: 'receiverId',
      as: 'receivedMessages'
    });

    // Связь с предупреждениями пользователя
    User.hasMany(models.UserWarning, {
      foreignKey: 'userId',
      as: 'warnings'
    });
  };

  // Метод для проверки пароля
  User.prototype.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Метод для исключения пароля из JSON
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  // Метод для привязки armaId к статистике
  User.linkArmaIdToStats = async function(userId, armaId) {
    const db = require('.');
    // user_stats
    await db.UserStats.update(
      { userId },
      { where: { armaId } }
    );
    // player_season_stats
    await db.PlayerSeasonStats.update(
      { userId },
      { where: { armaId } }
    );
  };

  return User;
};