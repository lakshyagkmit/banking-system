'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAccount extends Model {
    static associate(models) {
      // Account belongs to a Policy
      UserAccount.belongsTo(models.AccountPolicy, {
        foreignKey: 'policy_id',
      });

      // Account belongs to a Branch
      UserAccount.belongsTo(models.Branch, {
        foreignKey: 'branch_id',
      });

      // Account belongs to a User
      UserAccount.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
    }
  }

  UserAccount.init(
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
        defaultValue: 'savings',
      },
      number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      balance: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 0.0,
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
      modelName: 'UserAccount',
      tableName: 'user_accounts',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return UserAccount;
};
