'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Обновляем существующие отряды, добавляя статистику и результативность
    await queryInterface.bulkUpdate('squads', {
      stats: JSON.stringify({
        kills: 1250,
        deaths: 320,
        teamkills: 15,
        winRate: 78.5,
        avgKDR: 3.9,
        totalMatches: 156,
        wins: 122,
        losses: 34
      }),
      performance: JSON.stringify([
        { season: 1, place: 1, points: 850 },
        { season: 2, place: 2, points: 720 },
        { season: 3, place: 1, points: 920 },
        { season: 4, place: 3, points: 680 },
        { season: 5, place: 1, points: 890 }
      ]),
      updatedAt: new Date()
    }, { id: 1 }); // Элитные Воины

    await queryInterface.bulkUpdate('squads', {
      stats: JSON.stringify({
        kills: 450,
        deaths: 380,
        teamkills: 8,
        winRate: 45.2,
        avgKDR: 1.2,
        totalMatches: 89,
        wins: 40,
        losses: 49
      }),
      performance: JSON.stringify([
        { season: 1, place: 8, points: 320 },
        { season: 2, place: 6, points: 450 },
        { season: 3, place: 5, points: 520 },
        { season: 4, place: 4, points: 580 },
        { season: 5, place: 3, points: 650 }
      ]),
      updatedAt: new Date()
    }, { id: 2 }); // Новички Дружбы

    await queryInterface.bulkUpdate('squads', {
      stats: JSON.stringify({
        kills: 890,
        deaths: 210,
        teamkills: 5,
        winRate: 65.8,
        avgKDR: 4.2,
        totalMatches: 134,
        wins: 88,
        losses: 46,
        stealthKills: 320,
        nightWins: 45
      }),
      performance: JSON.stringify([
        { season: 1, place: 3, points: 680 },
        { season: 2, place: 1, points: 850 },
        { season: 3, place: 2, points: 780 },
        { season: 4, place: 1, points: 920 },
        { season: 5, place: 2, points: 810 }
      ]),
      updatedAt: new Date()
    }, { id: 3 }); // Ночные Охотники

    // Добавляем новые отряды с тестовыми данными
    await queryInterface.bulkInsert('squads', [
      {
        name: 'Танковая Дивизия',
        description: 'Специалисты по тяжелой технике и бронированным операциям.',
        leaderId: 1, // admin
        maxMembers: 12,
        stats: JSON.stringify({
          kills: 1100,
          deaths: 280,
          teamkills: 12,
          winRate: 72.3,
          avgKDR: 3.9,
          totalMatches: 142,
          wins: 103,
          losses: 39,
          tankKills: 450,
          vehicleDestroyed: 89
        }),
        performance: JSON.stringify([
          { season: 1, place: 2, points: 720 },
          { season: 2, place: 3, points: 680 },
          { season: 3, place: 4, points: 620 },
          { season: 4, place: 2, points: 780 },
          { season: 5, place: 4, points: 690 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Воздушные Асы',
        description: 'Эксперты воздушных боев и авиационных операций.',
        leaderId: 2, // testuser
        maxMembers: 8,
        stats: JSON.stringify({
          kills: 750,
          deaths: 180,
          teamkills: 3,
          winRate: 68.9,
          avgKDR: 4.2,
          totalMatches: 98,
          wins: 67,
          losses: 31,
          airKills: 420,
          dogfightWins: 38
        }),
        performance: JSON.stringify([
          { season: 1, place: 5, points: 520 },
          { season: 2, place: 4, points: 580 },
          { season: 3, place: 3, points: 650 },
          { season: 4, place: 5, points: 520 },
          { season: 5, place: 6, points: 480 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Удаляем новые отряды
    await queryInterface.bulkDelete('squads', { name: ['Танковая Дивизия', 'Воздушные Асы'] }, {});
    
    // Очищаем статистику у существующих отрядов
    await queryInterface.bulkUpdate('squads', {
      stats: null,
      performance: null,
      updatedAt: new Date()
    }, { id: [1, 2, 3] });
  }
}; 