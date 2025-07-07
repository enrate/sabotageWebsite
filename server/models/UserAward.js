const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAward extends Model {
    static associate(models) {
      // UserAward.belongsTo(models.User, { foreignKey: 'userId' });
      // UserAward.belongsTo(models.Award, { foreignKey: 'awardId' });
      // UserAward.belongsTo(models.User, { foreignKey: 'issuedBy', as: 'issuer' });
    }
  }
  UserAward.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    awardId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    issuedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserAward',
    tableName: 'user_awards',
    timestamps: true
  });
  return UserAward;
}; 