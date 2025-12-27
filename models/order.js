"use strict";
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define(
        "Order",
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            total_amount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
            pickup_time: DataTypes.TIME,
            break_slot: DataTypes.TEXT,
            created_at: DataTypes.DATE,
            updated_at: DataTypes.DATE,
            completed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            seen_by_canteen: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            seen_by_user: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
        },
        {
            tableName: "orders",
            timestamps: false
        }
    );

    Order.associate = models => {
        Order.belongsTo(models.User, { foreignKey: "user_id", onDelete: "CASCADE" });

        Order.hasMany(models.OrderItem, {
            foreignKey: "order_id",
            onDelete: "CASCADE"
        });
    };

    return Order;
};
