'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      contact: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      gov_issue_id_type: {
        type: Sequelize.ENUM('passport', 'adhar', 'pan', 'voter_id', 'driver_license'),
        defaultValue: 'adhar',
      },
      gov_issue_id_image: {
        type: Sequelize.TEXT,
      },
      father_name: {
        type: Sequelize.STRING(50),
      },
      mother_name: {
        type: Sequelize.STRING(50),
      },
      address: {
        type: Sequelize.TEXT,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  },
};
