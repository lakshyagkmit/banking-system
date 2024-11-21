'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    CREATE TYPE "public"."enum_user_accounts_status" AS ENUM('active', 'inactive');
  `);

    await queryInterface.createTable('user_accounts', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      policy_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account_policies',
          key: 'id',
        },
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      type: {
        type: Sequelize.ENUM('savings', 'current', 'fixed', 'recurring'),
        allowNull: false,
        defaultValue: 'savings',
      },
      number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      balance: {
        type: Sequelize.DECIMAL(20, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      nominee: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      installment_amount: {
        type: Sequelize.DECIMAL(20, 2),
      },
      principle_amount: {
        type: Sequelize.DECIMAL(20, 2),
      },
      maturity_date: {
        type: Sequelize.DATE,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'inactive',
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
    await queryInterface.dropTable('user_accounts');
  },
};
