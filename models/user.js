"use strict";
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        "User",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            username: DataTypes.TEXT,
            email: { type: DataTypes.TEXT, allowNull: false, unique: true },
            phone_number: DataTypes.STRING,
            role: { type: DataTypes.TEXT, allowNull: false },
            password: { type: DataTypes.TEXT, allowNull: false },
            must_change_password: { type: DataTypes.BOOLEAN, defaultValue: true },
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
            is_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
            failed_login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
            locked_until: DataTypes.DATE,
            password_reset_token: DataTypes.STRING,
            password_reset_expires_at: DataTypes.DATE,
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
            last_login_at: DataTypes.DATE
        },
        {
            tableName: "users",
            timestamps: false
        }
    );

    User.associate = models => {
        User.hasMany(models.Order, { foreignKey: "user_id" });
    };

    return User;
};