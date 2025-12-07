const { Order, OrderItem, MenuItem, User } = require("../models");

module.exports = {
    async createOrder(userId, items, pickup) {
        try {
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error("Narudžba mora sadržavati barem jednu stavku.");
            }

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

        } catch (err) {
            console.error("Error creating order:", err);
            throw new Error("Nije moguće kreirati narudžbu.");
        }
    },

    async getUserOrders(userId) {
        try {
            return await Order.findAll({
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
        } catch (err) {
            console.error(`Error fetching orders for user ${userId}:`, err);
            throw new Error("Nije moguće dohvatiti narudžbe korisnika.");
        }
    },

    async getOrderById(orderId) {
        try {
            return await Order.findByPk(orderId);
        } catch (err) {
            console.error(`Error fetching order ${orderId}:`, err);
            throw new Error("Nije moguće dohvatiti narudžbu.");
        }
    },

    async deleteOrder(id) {
        try {
            return await Order.destroy({ where: { id } });
        } catch (err) {
            console.error(`Error deleting order ${id}:`, err);
            throw new Error("Nije moguće obrisati narudžbu.");
        }
    },

    async deleteAllOrders() {
        try {
            await Order.destroy({ where: {} });
        } catch (err) {
            console.error("Error deleting all orders:", err);
            throw new Error("Nije moguće obrisati sve narudžbe.");
        }
    },

    async getAllOrders(where = {}, userWhere = {}, orderBy = null) {
        try {
            const hasUserFilters =
                Object.keys(userWhere).length > 0 ||
                Object.getOwnPropertySymbols(userWhere).length > 0;

            return await Order.findAll({
                where,
                include: [
                    {
                        model: User,
                        attributes: ["id", "username", "email", "phone_number", "role"],
                        where: hasUserFilters ? userWhere : undefined,
                        required: hasUserFilters
                    },
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
                ...(orderBy && { order: orderBy })
            });

        } catch (err) {
            console.error("Error fetching all orders:", err);
            throw new Error("Nije moguće dohvatiti narudžbe.");
        }
    }
};
