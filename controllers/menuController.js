const menuService = require("../services/menuService");
const orderService = require("../services/orderService");

module.exports = {
    async getMenu(req, res) {
        try {
            const {success} = req.query;
            const [menu, tags] = await menuService.getMenuItems({});
            const user = req.session.user;
            res.render("canteen/menu", { menu, tags, error: null, user, success: success || null});
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Došlo je do greške pri učitavanju menija.' });
        }
    },

    async showMenu(req, res) {
        try {
            let order = req.query.order;
            const user = req.session.user;
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
                error: null,
                user
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Došlo je do greške pri učitavanju stranice menija.' });
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

            req.session.save(() => {
                res.redirect("/user/menu");
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Došlo je do greške pri dodavanju proizvoda u korpu.' });
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

            req.session.save(() => {
                res.redirect("/user/menu");
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Došlo je do greške pri uklanjanju proizvoda iz korpe.' });
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
            console.error("Greška pri kreiranju narudžbe", error);

            try {
                let order = req.query.order;
                const user = req.session.user;
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
                    error: error.message,
                    user
                });
            } catch (innerErr) {
                console.error(innerErr);
                return res.status(500).render('error', { message: 'Greška pri obradi narudžbe.' });
            }
        }
    },

    async showOrders(req, res) {
        try {
            const userId = req.session.user.id;
            const user = req.session.user;
            const orders = await orderService.userOrders(userId);
            const { error, success } = req.query;
            res.render("user/orders", { orders, error, user, success});
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspjelo učitavanje narudžbi.' });
        }
    },

    async deleteOrder(req, res) {
        try {
            const orderId = req.params.id;
            const userId = req.session.user.id;

            const order = await orderService.getOrderById(orderId);

            if (!order || order.user_id !== userId) {
                return res.status(403).render('error', {
                    message: 'Nemate ovlasti za brisanje ove narudžbe.'
                });
            }

            await orderService.deleteOrder(orderId);

            return res.redirect('/user/orders?success=Narudžba je uspješno obrisana.');

        } catch (err) {
            console.error("Delete error:", err);

            if (err.message) {
                return res.redirect(`/user/orders?error=${encodeURIComponent(err.message)}`);
            }

            return res.status(500).render('error', {
                message: 'Neuspjelo brisanje narudžbe.'
            });
        }
    }
};
