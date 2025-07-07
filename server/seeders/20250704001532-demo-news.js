'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('news', [
      {
        title: 'Добро пожаловать на наш игровой сервер!',
        content: 'Мы рады приветствовать всех игроков на нашем сервере. Здесь вы найдете дружелюбное сообщество и увлекательные игры. Присоединяйтесь к отрядам и участвуйте в захватывающих сражениях!',
        authorId: 1, // admin
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Обновление сервера - новые возможности',
        content: 'Мы добавили новые карты, улучшили производительность и исправили множество багов. Теперь игра стала еще более стабильной и интересной. Проверьте все новинки!',
        authorId: 1, // admin
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Турнир выходного дня',
        content: 'В эти выходные состоится турнир между отрядами! Призы для победителей: уникальные скины и бонусы к опыту. Регистрация команд открыта до пятницы.',
        authorId: 2, // testuser
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Советы для новичков',
        content: 'Новые игроки часто спрашивают о лучших стратегиях. Вот несколько советов: всегда работайте в команде, изучайте карты, и не забывайте об экономике. Удачи в игре!',
        authorId: 3, // player1
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('news', null, {});
  }
};
