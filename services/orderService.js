const orderRepository = require("../repositories/orderRepository");

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
            const hour = Number(pickup_time.split(":")[0]);

            if (hour < 9 || hour > 15) {
                throw new Error("Pickup time must be between 09:00 and 15:00.");
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
    }
};