const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SquadInvite = sequelize.define('SquadInvite', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    squadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'squads', key: 'id' }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      defaultValue: 'pending',
      allowNull: false
    }
  }, {
    tableName: 'squad_invites',
    timestamps: true
  });

  SquadInvite.associate = (models) => {
    SquadInvite.belongsTo(models.Squad, { foreignKey: 'squadId', as: 'squad' });
    SquadInvite.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    SquadInvite.belongsTo(models.User, { foreignKey: 'invitedBy', as: 'inviter' });
  };

  return SquadInvite;
}; 