'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.update('roles', { code: '101' }, { name: 'Admin' });

    await queryInterface.update('roles', { code: '102' }, { name: 'Branch Manager' });

    await queryInterface.update('roles', { code: '103' }, { name: 'Customer' });
  },

  async down(queryInterface, Sequelize) {},
};
