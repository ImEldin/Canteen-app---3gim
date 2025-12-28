const { Order, OrderItem, MenuItem, User, sequelize } = require("../models");

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
                break_slot: pickup.break_slot || null,
                completed: false,
                seenByCanteen: false,
                seenByUser: false
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
                order: [
                    ["completed", "DESC"],
                    ["created_at", "DESC"]
                ]
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

    async getAllOrders({where = {}, userWhere = {}, orderBy = null, offset = 0, limit = 20}) {
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
                ...(orderBy && { order: orderBy }),
                offset,
                limit
            });

        } catch (err) {
            console.error("Error fetching all orders:", err);
            throw new Error("Nije moguće dohvatiti narudžbe.");
        }
    },

    async updateStatus(id, completed) {
        try {
            const [updated] = await Order.update(
                { completed },
                { where: { id } }
            );

            if (updated === 0) {
                throw new Error("Narudžba nije pronađena ili nije ažurirana.");
            }

            return true;

        } catch (err) {
            console.error(`Error updating status for order ${id}:`, err);
            throw new Error("Nije moguće ažurirati status narudžbe.");
        }
    },

    async getBreakSummary(slot) {
        try {
            const query = `
            SELECT 
                mi.id AS item_id,
                mi.name AS item_name,
                SUM(oi.quantity) AS total_quantity,
                SUM(oi.total_price) AS total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.break_slot = :slot AND o.completed = false
            GROUP BY mi.id, mi.name
            ORDER BY total_quantity DESC;
        `;

            const [results] = await sequelize.query(query, {
                replacements: { slot }
            });

            return results;

        } catch (err) {
            console.error(`Error fetching break summary for slot ${slot}:`, err);
            throw new Error("Nije moguće dohvatiti sažetak za ovaj odmor.");
        }
    },

    async getBreakTotal(breakName) {
        try {
            const [rows] = await sequelize.query(
                `SELECT COALESCE(SUM(oi.total_price), 0) AS total_sum
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.break_slot = :breakName
               AND o.completed = FALSE`,
                { replacements: { breakName } }
            );

            return rows[0].total_sum;

        } catch (err) {
            console.error(`Error fetching total for break ${breakName}:`, err);
            throw new Error("Nije moguće izračunati ukupni iznos za ovaj odmor.");
        }
    },

    async completeBreak(slot) {
        try {
            return await Order.update(
                { completed: true },
                {
                    where: {
                        break_slot: slot,
                        completed: false
                    }
                }
            );
        } catch (err) {
            console.error(`Error completing break ${slot}:`, err);
            throw new Error("Nije moguće označiti odmor kao završen.");
        }
    },

    async hasNewForCanteen() {
        try {
            const count = await Order.count({
                where: {
                    completed: false,
                    seen_by_canteen: false
                }
            });
            return count > 0;

        } catch (err) {
            console.error("Error checking new orders for canteen:", err);
            throw new Error("Nije moguće provjeriti nove narudžbe za kantinu.");
        }
    },

    async hasReadyForUser(userId) {
        try {
            const count = await Order.count({
                where: {
                    user_id: userId,
                    completed: true,
                    seen_by_user: false
                }
            });
            return count > 0;

        } catch (err) {
            console.error(`Error checking ready orders for user ${userId}:`, err);
            throw new Error("Nije moguće provjeriti spremne narudžbe korisnika.");
        }
    },

    async ackCanteenOrders() {
        try {
            await Order.update(
                { seen_by_canteen: true },
                {
                    where: {
                        completed: false,
                        seen_by_canteen: false
                    }
                }
            );

        } catch (err) {
            console.error("Error acknowledging canteen orders:", err);
            throw new Error("Nije moguće označiti narudžbe kantine kao viđene.");
        }
    },

    async ackUserOrders(userId) {
        try {
            await Order.update(
                { seen_by_user: true },
                {
                    where: {
                        user_id: userId,
                        completed: true,
                        seen_by_user: false
                    }
                }
            );

        } catch (err) {
            console.error(`Error acknowledging user orders for user ${userId}:`, err);
            throw new Error("Nije moguće označiti narudžbe korisnika kao viđene.");
        }
    },

};
