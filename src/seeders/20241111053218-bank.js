'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'banks',
      [
        {
          name: 'Federal Bank',
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {},
};
