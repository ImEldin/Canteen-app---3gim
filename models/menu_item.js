"use strict";
module.exports = (sequelize, DataTypes) => {
    const MenuItem = sequelize.define(
        "MenuItem",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.TEXT, allowNull: false },
            description: DataTypes.TEXT,
            price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
            image_url: DataTypes.TEXT,
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            }
        },
        {
            tableName: "menu_items",
            timestamps: false
        }
    );

    MenuItem.associate = models => {
        MenuItem.belongsToMany(models.Tag, {
            through: models.MenuItemTag,
            foreignKey: "menu_item_id",
        });

        MenuItem.hasMany(models.OrderItem, {
            foreignKey: "menu_item_id"
        });
    };

    return MenuItem;
};