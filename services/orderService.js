const orderRepository = require("../repositories/orderRepository");
const { Op } = require("sequelize");
const util = require("util");
const sseNotification = require("../realtime/sse");
const { getNow } = require('../utils/time');

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

                const now = getNow();
                const currentHour = now.getHours();
                if (currentHour < 8 || currentHour >= 16) {
                    throw new Error("Narudžbe se mogu praviti samo između 08:00 i 16:00.");
                }
                const breakTime = breakTimes[break_slot];
                const breakDate = getNow();
                breakDate.setHours(breakTime.hour, breakTime.minute, 0, 0);

                const thirtyMinBeforeBreak = new Date(breakDate.getTime() - 30 * 60 * 1000);

                if (now > thirtyMinBeforeBreak) {
                    throw new Error("Prekasno je za naručivanje za odabrani odmor. Narudžbe moraju biti napravljene najmanje 30 minuta prije početka odmora.");
                }
            }

            if (pickup_time) {
                const [hour, minute] = pickup_time.split(":").map(Number);

                const pickupMinutes = hour * 60 + minute;

                const firstBreakStart = 10 * 60 + 25;
                const firstBreakEnd   = 10 * 60 + 45;

                const secondBreakStart = 15 * 60 + 40;
                const secondBreakEnd   = 16 * 60;

                const inFirstBreak  = pickupMinutes >= firstBreakStart && pickupMinutes < firstBreakEnd;
                const inSecondBreak = pickupMinutes >= secondBreakStart && pickupMinutes < secondBreakEnd;

                if (inFirstBreak || inSecondBreak) {
                    throw new Error("Vrijeme preuzimanja ne može biti u periodu velikog odmora.");
                }

                if (hour < 8 || hour > 16 || (hour === 16 && minute > 0)) {
                    throw new Error("Vrijeme preuzimanja mora biti između 08:00 i 16:00.");
                }

                const now = getNow();
                const currentHour = now.getHours();
                if (currentHour < 8 || currentHour >= 16) {
                    throw new Error("Narudžbe se mogu praviti samo između 08:00 i 16:00.");
                }
                const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

                const pickupDate = getNow();
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

            const now = getNow();

            if (order.pickup_time) {
                const [hour, minute] = order.pickup_time.split(":").map(Number);

                const pickupDate = getNow();
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
                    const breakDate = getNow();
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

            if (filters.completed === "true") {
                where.completed = true;
            } else {
                where.completed = false;
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
    },

    async toggleStatus(orderId) {
        try {
            const order = await orderRepository.getOrderById(orderId);

            if (!order) {
                return { error: "Narudžba nije pronađena." };
            }

            const newStatus = order.completed ? false : true;

            await orderRepository.updateStatus(orderId, newStatus);

            if (newStatus === true) {
                sseNotification.notifyUser(order.user_id);
            }

            return {
                message: newStatus
                    ? "Narudžba je označena kao završena."
                    : "Narudžba je vraćena na aktivnu."
            };

        } catch (err) {
            console.error(err);
            return { error: "Greška pri ažuriranju statusa." };
        }
    },

    async getBreakReport(slot) {
        try {
            if (!slot) throw new Error("Nije odabran validan odmor.");

            const items = await orderRepository.getBreakSummary(slot);
            const total = await orderRepository.getBreakTotal(slot);

            return {
                slot,
                items,
                total: total || 0
            };

        } catch (err) {
            console.error(`Error fetching break report for slot "${slot}":`, err);
            throw new Error("Nije moguće učitati izvještaj za odmor.");
        }
    },


    async completeBreak(slot) {
        try {
            if (!slot) throw new Error("Nije odabran odmor za kompletiranje.");

            const valid = ["first_break", "second_break"];
            if (!valid.includes(slot)) {
                throw new Error("Nepoznat odmor.");
            }

            await orderRepository.completeBreak(slot);

            return { message: `Odmor je uspješno kompletiran.` };

        } catch (err) {
            console.error(`Error completing break "${slot}":`, err);
            throw new Error("Nije moguće kompletirati odmor.");
        }
    }
};
