'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('roles', 'code', {
        type: Sequelize.STRING(5),
        allowNull: true,
        unique: true,
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([queryInterface.removeColumn('roles', 'code')]);
  },
};
