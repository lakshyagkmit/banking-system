'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('account_policies', 'bank_id');
  },

  async down(queryInterface, Sequelize) {},
};
