'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('transactions', 'account_no', 'target_account_no');
  },

  async down(queryInterface, Sequelize) {},
};
