const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Award extends Model {
    static associate(models) {
      // Связи будут добавлены позже
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
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Award',
    tableName: 'awards',
    timestamps: true
  });
  return Award;
}; 