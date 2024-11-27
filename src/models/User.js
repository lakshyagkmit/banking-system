'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsToMany(models.Role, {
        through: models.UserRole,
        foreignKey: 'user_id',
        otherKey: 'role_id',
      });

      User.belongsToMany(models.Locker, {
        through: models.UserLocker,
        foreignKey: 'user_id',
        otherKey: 'locker_id',
      });

      User.hasMany(models.UserAccount, {
        foreignKey: 'user_id',
      });

      User.hasOne(models.Branch, {
        foreignKey: 'branch_manager_id',
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      contact: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      gov_issue_id_type: {
        type: DataTypes.ENUM('passport', 'adhar', 'pan', 'voter_id', 'driver_license'),
        defaultValue: 'adhar',
      },
      gov_issue_id_image: {
        type: DataTypes.TEXT,
      },
      father_name: {
        type: DataTypes.STRING(50),
      },
      mother_name: {
        type: DataTypes.STRING(50),
      },
      address: {
        type: DataTypes.TEXT,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return User;
};
