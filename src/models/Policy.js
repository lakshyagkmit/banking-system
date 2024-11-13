'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Policy extends Model {
    static associate(models) {
      // Define association with banks table
      Policy.belongsTo(models.Bank, {
        foreignKey: 'bank_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  Policy.init(
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
        type: DataTypes.ENUM('savings', 'current', 'fixed', 'deposit'),
        allowNull: false,
      },
      account_subtype: {
        type: DataTypes.STRING(50),
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
      modelName: 'Policy',
      tableName: 'policies',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Policy;
};
