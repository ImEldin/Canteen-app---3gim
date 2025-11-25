"use strict";
module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define(
        "OrderItem",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            order_id: { type: DataTypes.INTEGER, allowNull: false },
            menu_item_id: DataTypes.INTEGER,
            unit_price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
            quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
            total_price: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
            created_at: DataTypes.DATE
        },
        {
            tableName: "order_items",
            timestamps: false
        }
    );

    OrderItem.associate = models => {
        OrderItem.belongsTo(models.Order, { foreignKey: "order_id" });
        OrderItem.belongsTo(models.MenuItem, { foreignKey: "menu_item_id" });
    };

    return OrderItem;
};
