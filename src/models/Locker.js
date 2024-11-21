'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Locker extends Model {
    static associate(models) {
      Locker.belongsTo(models.Branch, {
        foreignKey: 'branch_id',
      });

      Locker.belongsToMany(models.User, {
        through: models.UserLocker,
        foreignKey: 'locker_id',
        otherKey: 'user_id',
      });
    }
  }

  Locker.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      branch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      serial_no: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      monthly_charge: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('available', 'freezed'),
        allowNull: false,
        defaultValue: 'available',
      },
    },
    {
      sequelize,
      modelName: 'Locker',
      tableName: 'lockers',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Locker;
};
