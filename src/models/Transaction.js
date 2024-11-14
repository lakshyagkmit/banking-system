'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      // Transaction belongs to an Account
      Transaction.belongsTo(models.Account, {
        foreignKey: 'account_id',
      });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      account_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      from_account_no: {
        type: DataTypes.STRING(20),
      },
      to_account_no: {
        type: DataTypes.STRING(20),
      },
      type: {
        type: DataTypes.ENUM('withdrawal', 'deposit', 'transfer'),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.ENUM('Credit Card', 'Debit Card', 'NEFT', 'RTGS', 'IMPS', 'UPI'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      balance_before: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      balance_after: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('completed', 'pending', 'failed'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Transaction;
};