'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Application extends Model {
    static associate(models) {
      // Define associations here
      Application.belongsTo(models.User, {
        foreignKey: 'user_id',
      });
    }
  }

  Application.init(
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
        allowNull: true,
      },
      account_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      account_subtype: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      nominee_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      locker_request_desc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Application',
      tableName: 'applications',
      underscored: true,
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return Application;
};
