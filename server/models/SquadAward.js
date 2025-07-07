const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SquadAward extends Model {
    static associate(models) {
      // SquadAward.belongsTo(models.Squad, { foreignKey: 'squadId' });
      // SquadAward.belongsTo(models.Award, { foreignKey: 'awardId' });
      // SquadAward.belongsTo(models.User, { foreignKey: 'issuedBy', as: 'issuer' });
    }
  }
  SquadAward.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    squadId: {
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
    modelName: 'SquadAward',
    tableName: 'squad_awards',
    timestamps: true
  });
  return SquadAward;
}; 