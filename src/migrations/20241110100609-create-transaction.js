'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      from_account_no: {
        type: Sequelize.STRING(20),
      },
      to_account_no: {
        type: Sequelize.STRING(20),
      },
      type: {
        type: Sequelize.ENUM('withdrawal', 'deposit', 'transfer'),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM('Credit Card', 'Debit Card', 'NEFT', 'RTGS', 'IMPS', 'UPI'),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },
      fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      balance_before: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('completed', 'pending', 'failed'),
        allowNull: false,
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
    await queryInterface.dropTable('transactions');
  },
};
