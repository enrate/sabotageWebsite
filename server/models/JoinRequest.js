const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JoinRequest = sequelize.define('JoinRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    squadId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'join_requests',
    timestamps: true
  });

  JoinRequest.associate = (models) => {
    JoinRequest.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    JoinRequest.belongsTo(models.Squad, { foreignKey: 'squadId', as: 'squad' });
  };

  return JoinRequest;
}; 