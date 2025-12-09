const orderRepository = require("../repositories/orderRepository");
const { Op } = require("sequelize");
const util = require("util");

module.exports = {
    async placeOrder(userId, cart, pickup = {}) {
        try {
            if (!cart || cart.length === 0) throw new Error("Korpa je prazna.");

            const { break_slot, pickup_time } = pickup;

            if (break_slot && pickup_time) {
                throw new Error("Odaberite ili jedan od dva odmora ili tačan termin preuzimanja, ne oboje.");
            }

            if (break_slot === null && pickup_time === null) {
                throw new Error("Morate izabrati odmor ili tačan termin preuzimanja.");
            }

            if (break_slot) {
                if (!["first_break", "second_break"].includes(break_slot)) {
                    throw new Error("Izabrani odmor nije validan.");
                }

                const breakTimes = {
                    first_break: { hour: 10, minute: 25 },   // prvi odmor
                    second_break: { hour: 15, minute: 40 }   // drugi odmor
                };

                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour < 9 || currentHour >= 15) {
                    throw new Error("Narudžbe se mogu praviti samo između 09:00 i 15:00.");
                }
                const breakTime = breakTimes[break_slot];
                const breakDate = new Date();
                breakDate.setHours(breakTime.hour, breakTime.minute, 0, 0);

                const thirtyMinBeforeBreak = new Date(breakDate.getTime() - 30 * 60 * 1000);

                if (now > thirtyMinBeforeBreak) {
                    throw new Error("Prekasno je za naručivanje za odabrani odmor. Narudžbe moraju biti napravljene najmanje 30 minuta prije početka odmora.");
                }
            }

            if (pickup_time) {
                const [hour, minute] = pickup_time.split(":").map(Number);
                if (hour < 9 || hour > 15 || (hour === 15 && minute > 0)) {
                    throw new Error("Vrijeme preuzimanja mora biti između 09:00 i 15:00.");
                }

                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour < 9 || currentHour >= 15) {
                    throw new Error("Narudžbe se mogu praviti samo između 09:00 i 15:00.");
                }
                const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

                const pickupDate = new Date();
                pickupDate.setHours(hour, minute, 0, 0);

                if (pickupDate < thirtyMinFromNow) {
                    throw new Error("Vrijeme preuzimanja mora biti najmanje 30 minuta od trenutka narudžbe.");
                }
            }

            return await orderRepository.createOrder(userId, cart, pickup);
        } catch (err) {
            console.error(`Error creating order for user ${userId}:`, err);
            throw new Error(err.message || "Narudžbu nije moguće kreirati.");
        }
    },

    async userOrders(userId) {
        try {
            return await orderRepository.getUserOrders(userId);
        } catch (err) {
            console.error(`Error fetching orders for user ${userId}:`, err);
            throw new Error("Nije moguće dohvatiti narudžbe korisnika.");
        }
    },

    async getOrderById(orderId) {
        try {
            return await orderRepository.getOrderById(orderId);
        } catch (err) {
            console.error(`Error fetching order ${orderId}:`, err);
            throw new Error("Nije moguće dohvatiti narudžbu.");
        }
    },

    async deleteOrder(orderId) {
        try {
            const order = await orderRepository.getOrderById(orderId);
            if (!order) throw new Error("Narudžba ne postoji.");

            const now = new Date();

            if (order.pickup_time) {
                const [hour, minute] = order.pickup_time.split(":").map(Number);

                const pickupDate = new Date();
                pickupDate.setHours(hour, minute, 0, 0);

                const thirtyMinBeforePickup = new Date(pickupDate.getTime() - 30 * 60 * 1000);

                if (now >= thirtyMinBeforePickup) {
                    throw new Error("Narudžbu nije moguće obrisati manje od 30 minuta prije preuzimanja.");
                }
            }

            if (order.break_slot) {
                const breakTimes = {
                    first_break:  { hour: 10, minute: 25 },
                    second_break: { hour: 15, minute: 40 }
                };

                const bt = breakTimes[order.break_slot];
                if (bt) {
                    const breakDate = new Date();
                    breakDate.setHours(bt.hour, bt.minute, 0, 0);

                    const thirtyMinBeforeBreak = new Date(breakDate.getTime() - 30 * 60 * 1000);

                    if (now >= thirtyMinBeforeBreak) {
                        throw new Error("Narudžbu nije moguće obrisati manje od 30 minuta prije odmora.");
                    }
                }
            }

            return await orderRepository.deleteOrder(orderId);

        } catch (err) {
            console.error(`Error deleting order ${orderId}:`, err);
            throw new Error(err.message || "Nije moguće obrisati narudžbu.");
        }
    },

    async getAllOrders({ page = 1, pageSize = 20, filters = {} }) {
        try {
            const where = {};
            const userWhere = {};

            if (filters.user) {
                userWhere[Op.or] = [
                    { username: { [Op.iLike]: `%${filters.user}%` } },
                    { email: { [Op.iLike]: `%${filters.user}%` } }
                ];
            }

            if (filters.break === "first_break") {
                where.break_slot = "first_break";
            } else if (filters.break === "second_break") {
                where.break_slot = "second_break";
            } else if (filters.break === "custom") {
                where.pickup_time = { [Op.ne]: null };
            }

            let orderBy = null;
            if (!filters.sort || filters.sort === "pickup_asc") {
                orderBy = [["pickup_time", "ASC"]];
            } else if (filters.sort === "pickup_desc") {
                orderBy = [["pickup_time", "DESC"]];
            } else if (filters.sort === "price_asc") {
                orderBy = [["total_amount", "ASC"]];
            } else if (filters.sort === "price_desc") {
                orderBy = [["total_amount", "DESC"]];
            }

            const offset = (page - 1) * pageSize;

            const result = await orderRepository.getAllOrders({
                where,
                userWhere,
                orderBy,
                offset,
                limit: pageSize + 1
            });

            const hasMore = result.length > pageSize;

            return {
                orders: result.slice(0, pageSize),
                hasMore
            };


        } catch (err) {
            console.error("Error fetching all orders:", err);
            throw new Error("Nije moguće dohvatiti narudžbe.");
        }
    }
};
