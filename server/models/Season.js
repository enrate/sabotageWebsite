const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Season extends Model {
    static associate(models) {
      Season.belongsTo(models.Award, { as: 'trophy1', foreignKey: 'trophy1Id' });
      Season.belongsTo(models.Award, { as: 'trophy2', foreignKey: 'trophy2Id' });
      Season.belongsTo(models.Award, { as: 'trophy3', foreignKey: 'trophy3Id' });
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
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    trophy1Id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    trophy2Id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    trophy3Id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    awardsIssued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Season',
    tableName: 'seasons',
    timestamps: true
  });
  return Season;
}; 