'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserApplication extends Model {
    static associate(models) {
      // Define associations here
      UserApplication.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
    }
  }

  UserApplication.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      branch_ifsc_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('savings', 'current', 'fixed', 'recurring', 'locker'),
        allowNull: false,
        defaultValue: 'savings',
      },
      nominee_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'UserApplication',
      tableName: 'user_applications',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return UserApplication;
};
