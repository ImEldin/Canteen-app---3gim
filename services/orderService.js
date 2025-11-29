const orderRepository = require("../repositories/orderRepository");
const { Op } = require("sequelize");
const util = require("util");

module.exports = {
    async placeOrder(userId, cart, pickup) {
        if (!cart || cart.length === 0) {
            throw new Error("Cart is empty.");
        }
        const { break_slot, pickup_time } = pickup;

        if(break_slot && pickup_time){
            throw new Error("Please select either a break slot or a specific pickup time, not both.");
        }

        if (break_slot) {
            if (!["first_break", "second_break"].includes(break_slot)) {
                throw new Error("Invalid break slot.");
            }
        }

        if (pickup_time) {
            const [hour, minute] = pickup_time.split(":").map(Number);
            if (hour < 9 || hour > 15 || (hour === 15 && minute > 0)) {
                throw new Error("Pickup time must be between 09:00 and 15:00.");
            }

            const now = new Date();
            const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

            const pickupDate = new Date();
            pickupDate.setHours(hour, minute, 0, 0);

            if (pickupDate < thirtyMinFromNow) {
                throw new Error("Pickup time must be at least 30 minutes from now.");
            }

        }

        return orderRepository.createOrder(userId, cart, pickup);
    },

    async userOrders(userId) {
        return orderRepository.getUserOrders(userId);
    },

    async getOrderById(orderId) {
        return orderRepository.getOrderById(orderId);
    },

    async deleteOrder(orderId) {
        return orderRepository.deleteOrder(orderId);
    },

    async getAllOrders(filters) {
        const where = {};
        const userWhere = {};

        console.log(filters.user)

        if (filters.user) {
            userWhere[Op.or] = [
                { username: { [Op.iLike]: `%${filters.user}%` } },
                { email: { [Op.iLike]: `%${filters.user}%` } }
            ];
        }
        console.log(
            util.inspect(userWhere, {
                showHidden: true,   // shows Symbols (Op.or, Op.iLike, etc.)
                depth: null,        // no depth limit
                colors: true
            })
        );

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
        }else if (filters.sort === "price_asc") {
            orderBy = [["total_amount", "ASC"]];
        } else if (filters.sort === "price_desc") {
            orderBy = [["total_amount", "DESC"]];
        }

        return orderRepository.getAllOrders(where, userWhere, orderBy);
    }
};