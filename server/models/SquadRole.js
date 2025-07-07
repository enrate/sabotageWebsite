const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadRole = sequelize.define('SquadRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    squadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'squads',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('member', 'deputy'),
      allowNull: false,
      defaultValue: 'member'
    }
  }, {
    tableName: 'squad_roles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'squadId']
      }
    ]
  });

  SquadRole.associate = (models) => {
    SquadRole.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    SquadRole.belongsTo(models.Squad, {
      foreignKey: 'squadId',
      as: 'squad'
    });
  };

  return SquadRole;
}; 