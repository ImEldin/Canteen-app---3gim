"use strict";
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define(
        "Order",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            total_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
            pickup_time: DataTypes.DATE,
            break_slot: DataTypes.TEXT,
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE
        },
        {
            tableName: "orders",
            timestamps: false
        }
    );

    Order.associate = models => {
        Order.belongsTo(models.User, { foreignKey: "user_id" });

        Order.hasMany(models.OrderItem, {
            foreignKey: "order_id",
            onDelete: "CASCADE"
        });
    };

    return Order;
};
