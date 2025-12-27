const orderNotificationService = require('../services/orderNotificationService');

module.exports = {

    async injectNotification(req, res, next) {
        try {
            const user = req.session.user;

            res.locals.hasNotification = await orderNotificationService.hasNotification(user);
            return next();

        } catch (err) {
            console.error("Notification inject error:", err);
            res.locals.hasNotification = false;
            return next();
        }
    },

    async acknowledge(req, res, next) {
        try {
            const user = req.session.user;

            await orderNotificationService.acknowledge(user);
            return next();

        } catch (err) {
            console.error("Notification acknowledge error:", err);
            return next();
        }
    }
};
