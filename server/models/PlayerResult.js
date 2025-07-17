module.exports = (sequelize, DataTypes) => {
  const PlayerResult = sequelize.define('PlayerResult', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    playerIdentity: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    result: {
      type: DataTypes.STRING(16), // win/lose
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    eloChange: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Изменение эло за матч'
    },
  }, {
    tableName: 'player_results',
    timestamps: true,
  });
  return PlayerResult;
}; 