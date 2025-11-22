"use strict";
module.exports = (sequelize, DataTypes) => {
    const MenuItemTag = sequelize.define(
        "MenuItemTag",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            menu_item_id: { type: DataTypes.INTEGER, allowNull: false },
            tag_id: { type: DataTypes.INTEGER, allowNull: false }
        },
        {
            tableName: "menu_item_tags",
            timestamps: false
        }
    );

    return MenuItemTag;
};