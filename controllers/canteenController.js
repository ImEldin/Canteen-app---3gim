const orderService = require('../services/orderService');
const menuService = require('../services/menuService');
const upload = require('../utils/uploads');

module.exports = {

    uploadMiddleware: upload.array("images"),

    showDashboard(req, res) {
        try {
            const user = req.session.user;
            res.render('canteen/dashboard', { user });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri učitavanju početne stranice.' });
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
            res.status(500).render('error', { message: 'Neuspješno učitavanje narudžbi.' });
        }
    },

    async createMenu(req, res) {
        try {
            if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
                return res.render('canteen/menu', { error: 'Meni mora sadržavati barem jednu stavku.', items: [] });
            }

            const items = req.body.items;

            if (req.files && req.files.length > 0) {
                items.forEach((item, idx) => {
                    if (req.files[idx]) {
                        item.image = `/uploads/${req.files[idx].filename}`;
                    }
                });
            }
            await menuService.createMenu(items);
            res.redirect("/canteen/menu");

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješno kreiranje menija.' });
        }
    },

    async deactivateMenu(req, res) {
        try {
            await menuService.deactivateMenu();
            res.redirect("/canteen/menu");
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješno deaktiviranje menija.' });
        }
    }
};
