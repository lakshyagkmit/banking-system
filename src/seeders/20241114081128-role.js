'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('roles', { code: '101' }, { name: 'Admin' });

    await queryInterface.bulkUpdate('roles', { code: '102' }, { name: 'Branch Manager' });

    await queryInterface.bulkUpdate('roles', { code: '103' }, { name: 'Customer' });
  },

  async down(queryInterface, Sequelize) {},
};
