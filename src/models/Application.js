'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Application extends Model {
    static associate(models) {
      // Define associations here
      Application.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      account_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      account_subtype: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      nominee_name: {
        type: DataTypes.STRING(50),
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
