const menuService = require("../services/menuService");
const orderService = require("../services/orderService");
const e = require("express");

module.exports = {
    async showMenu(req, res) {
        const menu = await menuService.getMenuItems();

        if (!req.session.cart) req.session.cart = [];

        const total = req.session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        res.render("user/menu", {
            menu,
            cart: req.session.cart,
            total: total
        });
    },

    async addToCart(req, res) {
        const itemId = parseInt(req.params.id);

        if (!req.session.cart) req.session.cart = [];

        const item = await menuService.getMenuItemById(itemId)
        if (!item) return res.redirect("/user/menu");

        const existing = req.session.cart.find(item => item.id === itemId);

        if (existing) {
            existing.quantity += 1;
        } else {
            req.session.cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: 1
            });
        }

        res.redirect("/user/menu");
    },

    async removeFromCart(req, res){
        const itemId = parseInt(req.params.id);

        if (!req.session.cart) {
            req.session.cart = [];
        }
        const existing = req.session.cart.find(item => item.id === itemId);

        if(existing && existing.quantity > 1){
            existing.quantity -= 1;
        }
        else{
            req.session.cart = req.session.cart.filter(item => item.id !== itemId);
        }

        res.redirect('/user/menu');
    },

    async confirmOrder(req, res) {
        try {
            const userId = req.session.user.id;
            const cart = req.session.cart;
            const { break_slot, pickup_time } = req.body;

            await orderService.placeOrder(
                userId,
                cart,
                {
                    break_slot: break_slot || null,
                    pickup_time: pickup_time || null
                }
            );

            req.session.cart = [];

            res.redirect("/user/orders");
        }catch (error) {
            console.error("Error placing order:", error);
            res.status(400).send("An error occurred while placing your order. Please try again.");
        }
    },

    async showOrders(req, res) {
        const userId = req.session.user.id;
        const orders = await orderService.userOrders(userId);

        res.render("user/orders", { orders });
    },

    async deleteOrder(req, res) {
        try {
            const orderId = req.params.id;
            const userId = req.session.user.id;

            const order = await orderService.getOrderById(orderId);

            if (!order || order.user_id !== userId) {
                return res.status(403).send("Unauthorized");
            }

            await orderService.deleteOrder(orderId);

            res.redirect("/user/orders");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error deleting order");
        }
    }
};
