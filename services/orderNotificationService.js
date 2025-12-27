const orderRepository = require("../repositories/orderRepository");

module.exports = {

    async hasNotification(user) {
        try {
            if (!user) throw new Error("Korisnik nije prijavljen.");

            if (user.role === "kantina") {
                return await orderRepository.hasNewForCanteen();
            }

            if (user.role === "ucenik") {
                return await orderRepository.hasReadyForUser(user.id);
            }

            return false;

        } catch (err) {
            console.error("Error checking notification state:", err);
            throw new Error("Nije moguće provjeriti stanje notifikacija.");
        }
    },

    async acknowledge(user) {
        try {
            if (!user) throw new Error("Korisnik nije prijavljen.");

            if (user.role === "kantina") {
                return await orderRepository.ackCanteenOrders();
            }

            if (user.role === "ucenik") {
                return await orderRepository.ackUserOrders(user.id);
            }

        } catch (err) {
            console.error("Error acknowledging notifications:", err);
            throw new Error("Nije moguće označiti notifikacije kao viđene.");
        }
    }
};
