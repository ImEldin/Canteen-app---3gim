const orderService = require('../services/orderService');

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
    }
}

