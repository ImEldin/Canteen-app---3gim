const orderService = require('../services/orderService');
const menuService = require('../services/menuService');

module.exports = {
    showDashboard(req, res) {
        try {
            const user = req.session.user;
            res.render('canteen/dashboard', { user });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load dashboard.' });
        }
    },

    async showOrders(req, res) {
        try {
            const filters = {
                user: req.query.user || "",
                role: req.query.role || "",
                break: req.query.break || "",
                sort: req.query.sort || "newest"
            };

            const orders = await orderService.getAllOrders(filters);

            res.render('canteen/orders', { orders, filters });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load orders.' });
        }
    },

    async createMenu(req, res) {
        try {
            if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
                return res.render('canteen/menu', { error: 'Menu must contain at least one item.', items: [] });
            }

            await menuService.createMenu(req.body.items);
            res.redirect("/canteen/menu");

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to create menu.' });
        }
    },

    async deactivateMenu(req, res) {
        try {
            await menuService.deactivateMenu();
            res.redirect("/canteen/menu");
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to deactivate menu.' });
        }
    },

    async deleteMenu(req, res) {
        try {
            await menuService.deleteMenu();
            res.redirect("/canteen/menu");
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to delete menu.' });
        }
    }
};
