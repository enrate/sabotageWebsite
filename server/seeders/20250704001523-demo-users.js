'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        elo: 1800,
        kills: 200,
        deaths: 80,
        teamkills: 2,
        winrate: 75.5,
        matches: 60,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        elo: 1200,
        kills: 90,
        deaths: 70,
        teamkills: 1,
        winrate: 48.2,
        matches: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        username: 'player1',
        email: 'player1@example.com',
        password: hashedPassword,
        role: 'user',
        elo: 1500,
        kills: 130,
        deaths: 60,
        teamkills: 0,
        winrate: 62.1,
        matches: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        username: 'player2',
        email: 'player2@example.com',
        password: hashedPassword,
        role: 'user',
        elo: 1350,
        kills: 110,
        deaths: 65,
        teamkills: 3,
        winrate: 55.7,
        matches: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
