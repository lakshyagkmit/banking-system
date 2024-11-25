'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      // Branch belongs to a bank
      Branch.belongsTo(models.Bank, {
        foreignKey: 'bank_id',
      });

      // Branch managed by a bran
      Branch.belongsTo(models.User, {
        foreignKey: 'branch_manager_id',
      });
    }
  }

  Branch.init(
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
      branch_manager_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ifsc_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
      },
      contact: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      total_lockers: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Branch',
      tableName: 'branches',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Branch;
};
