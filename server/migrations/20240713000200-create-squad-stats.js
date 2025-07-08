module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('squad_stats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      squadId: {
        type: Sequelize.INTEGER,
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
      lastUpdated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('squad_stats');
  }
}; 