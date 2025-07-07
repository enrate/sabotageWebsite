module.exports = (sequelize, DataTypes) => {
  const KillLog = sequelize.define('KillLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    friendlyFire: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    suicide: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    killerIdentity: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    victimIdentity: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'kill_logs',
    timestamps: true,
  });
  return KillLog;
}; 