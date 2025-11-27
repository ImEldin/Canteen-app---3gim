"use strict";
module.exports = (sequelize, DataTypes) => {
    const TempPassword = sequelize.define(
        "TempPassword",
        {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, {
        tableName: "temp_passwords",
        timestamps: false
    });

    return TempPassword;
};