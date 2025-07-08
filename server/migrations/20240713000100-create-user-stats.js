module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_stats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      armaId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      kills: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      deaths: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      teamkills: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastUpdated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_stats');
  }
}; 