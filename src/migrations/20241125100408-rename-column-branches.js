'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('branches', 'user_id', 'branch_manager_id');
  },

  async down(queryInterface, Sequelize) {},
};
