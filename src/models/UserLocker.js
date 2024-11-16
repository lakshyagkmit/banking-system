'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserLocker extends Model {
    static associate(models) {
      UserLocker.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
      UserLocker.belongsTo(models.Locker, {
        foreignKey: 'locker_id',
      });
    }
  }

  UserLocker.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      locker_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UserLocker',
      tableName: 'users_lockers',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return UserLocker;
};
