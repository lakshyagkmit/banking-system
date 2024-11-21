'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccountPolicy extends Model {
    static associate(models) {
      // Define association with banks table
      AccountPolicy.belongsTo(models.Bank, {
        foreignKey: 'bank_id',
      });
    }
  }

  AccountPolicy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bank_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      account_type: {
        type: DataTypes.ENUM('savings', 'current', 'fixed', 'recurring'),
        allowNull: false,
        defaultValue: 'savings',
      },
      initial_amount: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      interest_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      minimum_amount: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.0,
      },
      lock_in_period: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      penalty_fee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
    },
    {
      sequelize,
      modelName: 'AccountPolicy',
      tableName: 'account_policies',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return AccountPolicy;
};
