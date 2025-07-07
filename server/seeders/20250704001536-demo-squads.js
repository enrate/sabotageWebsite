'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Создаем отряды
    await queryInterface.bulkInsert('squads', [
      {
        name: 'Элитные Воины',
        description: 'Профессиональная команда для серьезных игроков. Требуем дисциплину и командную работу.',
        leaderId: 1, // admin
        maxMembers: 15,
        stats: JSON.stringify({
          kills: 1250,
          deaths: 320,
          teamkills: 15,
          avg_winRate: 78.5,
          elo: 1850
        }),
        performance: JSON.stringify([
          { season: 1, place: 1, points: 850 },
          { season: 2, place: 2, points: 720 },
          { season: 3, place: 1, points: 920 },
          { season: 4, place: 3, points: 680 },
          { season: 5, place: 1, points: 890 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Новички Дружбы',
        description: 'Дружелюбный отряд для новичков. Помогаем друг другу и учимся вместе.',
        leaderId: 2, // testuser
        maxMembers: 20,
        stats: JSON.stringify({
          kills: 450,
          deaths: 380,
          teamkills: 8,
          avg_winRate: 45.2,
          elo: 1250
        }),
        performance: JSON.stringify([
          { season: 1, place: 8, points: 320 },
          { season: 2, place: 6, points: 450 },
          { season: 3, place: 5, points: 520 },
          { season: 4, place: 4, points: 580 },
          { season: 5, place: 3, points: 650 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ночные Охотники',
        description: 'Специализируемся на ночных рейдах и скрытных операциях.',
        leaderId: 3, // player1
        maxMembers: 10,
        stats: JSON.stringify({
          kills: 890,
          deaths: 210,
          teamkills: 5,
          avg_winRate: 65.8,
          elo: 1650
        }),
        performance: JSON.stringify([
          { season: 1, place: 3, points: 680 },
          { season: 2, place: 1, points: 850 },
          { season: 3, place: 2, points: 780 },
          { season: 4, place: 1, points: 920 },
          { season: 5, place: 2, points: 810 }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Танковая Дивизия',
        description: 'Специалисты по тяжелой технике и бронированным операциям.',
        leaderId: 1, // admin
        maxMembers: 12,
        stats: JSON.stringify({
          kills: 1100,
          deaths: 280,
          teamkills: 12,
          avg_winRate: 72.3,
          elo: 1750
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
          avg_winRate: 68.9,
          elo: 1550
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

    // Получаем id созданных отрядов
    const squads = await queryInterface.sequelize.query(
      'SELECT id, name FROM squads ORDER BY id',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Присваиваем squadId пользователям на основе созданных отрядов
    for (const squad of squads) {
      if (squad.name === 'Элитные Воины') {
        await queryInterface.bulkUpdate('users', { squadId: squad.id }, { id: 1 }); // admin
        await queryInterface.bulkUpdate('users', { squadId: squad.id }, { id: 4 }); // player2
      } else if (squad.name === 'Новички Дружбы') {
        await queryInterface.bulkUpdate('users', { squadId: squad.id }, { id: 2 }); // testuser
      } else if (squad.name === 'Ночные Охотники') {
        await queryInterface.bulkUpdate('users', { squadId: squad.id }, { id: 3 }); // player1
      }
    }

    // Создаем записи в squad_roles только для участников (не лидеров)
    for (const squad of squads) {
      if (squad.name === 'Элитные Воины') {
        await queryInterface.bulkInsert('squad_roles', [
          {
            userId: 4,
            squadId: squad.id,
            role: 'member',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            userId: 2,
            squadId: squad.id,
            role: 'deputy',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ], {});
      } else if (squad.name === 'Новички Дружбы') {
        await queryInterface.bulkInsert('squad_roles', [
          {
            userId: 3,
            squadId: squad.id,
            role: 'member',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ], {});
      } else if (squad.name === 'Ночные Охотники') {
        await queryInterface.bulkInsert('squad_roles', [
          {
            userId: 4,
            squadId: squad.id,
            role: 'deputy',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Удалить связанные записи перед удалением отрядов
    await queryInterface.bulkDelete('join_requests', null, {});
    await queryInterface.bulkDelete('squad_warnings', null, {});
    await queryInterface.bulkDelete('squad_history', null, {});
    await queryInterface.bulkDelete('squad_roles', null, {});
    // Сбросить squadId у всех пользователей
    await queryInterface.bulkUpdate('users', { squadId: null }, {});
    await queryInterface.bulkDelete('squads', null, {});
  }
};
