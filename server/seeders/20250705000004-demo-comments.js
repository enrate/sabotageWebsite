'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем базовые комментарии
    await queryInterface.bulkInsert('comments', [
      {
        content: 'Отличная новость! Спасибо за информацию.',
        newsId: 1,
        userId: 2, // testuser
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        content: 'Добро пожаловать всем новым игрокам!',
        newsId: 1,
        userId: 1, // admin
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        content: 'Обновление действительно порадовало, стало лучше!',
        newsId: 2,
        userId: 3, // player1
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Получаем id только что созданного комментария для вложенного ответа
    const [comments] = await queryInterface.sequelize.query(
      'SELECT id FROM comments WHERE newsId = 2 AND userId = 3 ORDER BY id DESC LIMIT 1'
    );
    const parentId = comments[0]?.id;
    if (parentId) {
      await queryInterface.bulkInsert('comments', [
        {
          content: 'Спасибо за обратную связь! Мы старались.',
          newsId: 2,
          userId: 1, // admin
          parentId: parentId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('comments', null, {});
  }
}; 