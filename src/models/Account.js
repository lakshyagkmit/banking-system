'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      // Account belongs to a Policy
      Account.belongsTo(models.Policy, {
        foreignKey: 'policy_id',
      });

      // Account belongs to a Branch
      Account.belongsTo(models.Branch, {
        foreignKey: 'branch_id',
      });

      // Account belongs to a User
      Account.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
    }
  }

  Account.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      policy_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      branch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('savings', 'current', 'fixed', 'recurring'),
        allowNull: false,
      },
      subtype: {
        type: DataTypes.STRING(50),
      },
      number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      balance: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
      },
      interest_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      nominee: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      installment_amount: {
        type: DataTypes.DECIMAL(20, 2),
      },
      principle_amount: {
        type: DataTypes.DECIMAL(20, 2),
      },
      maturity_date: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'inactive',
      },
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Account;
};
