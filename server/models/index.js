const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

db.JoinRequest = require('./JoinRequest.js')(sequelize);
db.SquadWarning = require('./SquadWarning.js')(sequelize);
db.SquadRole = require('./SquadRole.js')(sequelize);
db.Comment = require('./Comment.js')(sequelize);
db.Message = require('./Message.js')(sequelize);
db.User = require('./User.js')(sequelize);
const Award = require('./Award.js')(sequelize, Sequelize.DataTypes);
const Season = require('./Season.js')(sequelize, Sequelize.DataTypes);
const UserAward = require('./UserAward.js')(sequelize, Sequelize.DataTypes);
const SquadAward = require('./SquadAward.js')(sequelize, Sequelize.DataTypes);

// Ассоциации для наград
Award.hasMany(UserAward, { foreignKey: 'awardId' });
Award.hasMany(SquadAward, { foreignKey: 'awardId' });
UserAward.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
UserAward.belongsTo(Award, { foreignKey: 'awardId' });
UserAward.belongsTo(db.User, { foreignKey: 'issuedBy', as: 'issuer' });
SquadAward.belongsTo(db.Squad, { foreignKey: 'squadId' });
SquadAward.belongsTo(Award, { foreignKey: 'awardId' });
SquadAward.belongsTo(db.User, { foreignKey: 'issuedBy', as: 'issuer' });

// Ассоциация для активной награды пользователя
db.User.belongsTo(Award, { foreignKey: 'activeAwardId', as: 'activeAward' });

// Ассоциация для получения всех наград пользователя
db.User.hasMany(UserAward, { foreignKey: 'userId', as: 'UserAwards' });

// Ассоциации для сезонов
Season.hasMany(Award, { foreignKey: 'seasonId', as: 'seasonAwards' });
Award.belongsTo(Season, { foreignKey: 'seasonId', as: 'season' });

// Ассоциации для трофеев сезона
Season.belongsTo(Award, { as: 'trophy1', foreignKey: 'trophy1Id' });
Season.belongsTo(Award, { as: 'trophy2', foreignKey: 'trophy2Id' });
Season.belongsTo(Award, { as: 'trophy3', foreignKey: 'trophy3Id' });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Award = Award;
db.Season = Season;
db.UserAward = UserAward;
db.SquadAward = SquadAward;

db.PlayerSeasonStats = require('./PlayerSeasonStats.js')(sequelize);
db.SquadSeasonStats = require('./SquadSeasonStats.js')(sequelize);

module.exports = db; 