'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', {
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
          model: 'policies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      account_type: {
        type: Sequelize.ENUM('savings', 'current', 'fixed', 'deposit'),
        allowNull: false,
      },
      account_subtype: {
        type: Sequelize.STRING(50),
      },
      number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      balance: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },
      interest_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      nominee: {
        type: Sequelize.STRING(50),
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
    await queryInterface.dropTable('accounts');
  },
};
