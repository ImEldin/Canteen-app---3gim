const orderService = require('../services/orderService');
const menuService = require('../services/menuService');

module.exports = {
    showDashboard(req, res) {
        const user = req.session.user;
        res.render('canteen/dashboard', {user});
    },

    async showOrders(req, res) {

        const filters = {
            user: req.query.user || "",
            role: req.query.role || "",
            break: req.query.break || "",
            sort: req.query.sort || "newest"
        }

        const orders = await orderService.getAllOrders(filters);

        res.render('canteen/orders', {orders, filters});
    },

    async createMenu(req, res) {
        try {
            await menuService.createMenu(req.body.items);
            res.redirect("/canteen/menu");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error creating menu");
        }
    },

    async deactivateMenu(req, res) {
        try {
            await menuService.deactivateMenu();
            res.redirect("/canteen/menu");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error deactivating menu");
        }
    },

    async deleteMenu(req, res) {
        try {
            await menuService.deleteMenu();
            res.redirect("/canteen/menu");
        } catch (err) {
            console.error(err);
            res.status(500).send("Error deleting menu");
        }
    }
}

