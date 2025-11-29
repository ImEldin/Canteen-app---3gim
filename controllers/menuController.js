const menuService = require("../services/menuService");
const orderService = require("../services/orderService");

module.exports = {
    async getMenu(req, res) {
        try {
            const [menu, tags] = await menuService.getMenuItems({});
            res.render("canteen/menu", { menu, tags, error: null });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load menu.' });
        }
    },

    async showMenu(req, res) {
        try {
            let order = req.query.order;
            let orderBy = null;

            if(order === "price_asc") orderBy = [["price", "ASC"]];
            else if(order === "price_desc") orderBy = [["price", "DESC"]];

            const filters = {
                tag: req.query.tag || "",
                name: req.query.name || "",
                orderBy: orderBy
            };

            const [menu, tags] = await menuService.getMenuItems(filters);

            if (!req.session.cart) req.session.cart = [];

            const total = req.session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

            res.render("user/menu", {
                menu,
                cart: req.session.cart,
                total,
                filters,
                tags,
                error: null
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load menu page.' });
        }
    },

    async addToCart(req, res) {
        try {
            const itemId = parseInt(req.params.id);
            if (!req.session.cart) req.session.cart = [];

            const item = await menuService.getMenuItemById(itemId);
            if (!item) {
                return res.redirect("/user/menu");
            }

            const existing = req.session.cart.find(i => i.id === itemId);
            if (existing) existing.quantity += 1;
            else req.session.cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });

            res.redirect("/user/menu");

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to add item to cart.' });
        }
    },

    async removeFromCart(req, res) {
        try {
            const itemId = parseInt(req.params.id);
            if (!req.session.cart) req.session.cart = [];

            const existing = req.session.cart.find(i => i.id === itemId);
            if (existing && existing.quantity > 1) {
                existing.quantity -= 1;
            } else {
                req.session.cart = req.session.cart.filter(i => i.id !== itemId);
            }

            res.redirect('/user/menu');

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to remove item from cart.' });
        }
    },

    async confirmOrder(req, res) {
        try {
            const userId = req.session.user.id;
            const cart = req.session.cart || [];
            const { break_slot, pickup_time } = req.body;

            if (cart.length === 0) {
                return res.redirect("/user/menu");
            }

            await orderService.placeOrder(userId, cart, {
                break_slot: break_slot || null,
                pickup_time: pickup_time || null
            });

            req.session.cart = [];
            res.redirect("/user/orders");

        } catch (error) {
            console.error("Error placing order:", error);

            try {
                let order = req.query.order;
                let orderBy = null;
                if (order === "price_asc") orderBy = [["price", "ASC"]];
                else if (order === "price_desc") orderBy = [["price", "DESC"]];

                const filters = {
                    tag: req.query.tag || "",
                    name: req.query.name || "",
                    orderBy: orderBy
                };

                const [menu, tags] = await menuService.getMenuItems(filters);
                const cart = req.session.cart || [];
                const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

                return res.render("user/menu", {
                    menu,
                    cart,
                    total,
                    filters,
                    tags,
                    error: error.message
                });
            } catch (innerErr) {
                console.error(innerErr);
                return res.status(500).render('error', { message: 'Failed to process order.' });
            }
        }
    },

    async showOrders(req, res) {
        try {
            const userId = req.session.user.id;
            const orders = await orderService.userOrders(userId);
            res.render("user/orders", { orders, error: null });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load orders.' });
        }
    },

    async deleteOrder(req, res) {
        try {
            const orderId = req.params.id;
            const userId = req.session.user.id;

            const order = await orderService.getOrderById(orderId);
            if (!order || order.user_id !== userId) {
                return res.status(403).render('error', { message: 'Unauthorized to delete this order.' });
            }

            await orderService.deleteOrder(orderId);
            res.redirect("/user/orders");

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to delete order.' });
        }
    }
};
