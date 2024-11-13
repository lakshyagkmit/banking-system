'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserLocker extends Model {
    static associate(models) {
      // Associations to User and Locker models
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
        type: DataTypes.ENUM('available', 'freezed'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UserLocker',
      tableName: 'userlockers',
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
