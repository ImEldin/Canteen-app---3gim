const { Order, OrderItem, MenuItem } = require("../models");

module.exports = {
    async createOrder(userId, items, pickup) {
        let totalAmount = 0;
        for (const item of items) {
            totalAmount += item.price * item.quantity;
        }

        const order = await Order.create({
            user_id: userId,
            total_amount: totalAmount,
            pickup_time: pickup.pickup_time || null,
            break_slot: pickup.break_slot || null
        });

        for (const item of items) {
            await OrderItem.create({
                order_id: order.id,
                menu_item_id: item.id,
                unit_price: item.price,
                quantity: item.quantity,
                total_price: item.price * item.quantity
            });
        }

        return order.id;
    },

    async getUserOrders(userId) {
        return Order.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: OrderItem,
                    include: [
                        {
                            model: MenuItem,
                            attributes: ["name"]
                        }
                    ]
                }
            ],
            order: [["created_at", "DESC"]]
        });
    },

    async getOrderById(orderId) {
        return Order.findByPk(orderId);
    },

    async deleteOrder(id) {
        return Order.destroy({ where: { id } });
    }
};