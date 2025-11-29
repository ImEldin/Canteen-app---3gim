const cron = require("node-cron");
const orderRepository = require("../repositories/orderRepository");
const menuRepository = require("../repositories/menuRepository");

function scheduleDailyCleanup() {
    // Every night at 00:00
    cron.schedule("0 0 * * *", async () => {
        try {
            console.log("[Scheduler] Starting daily cleanup of all orders and inactive menu items...");

            await orderRepository.deleteAllOrders();

            await menuRepository.deleteInactiveMenuItems();

            console.log("[Scheduler] Daily cleanup completed successfully.");
        } catch (err) {
            console.error("[Scheduler] Error during daily cleanup:", err);
        }
    }, {
        timezone: "Europe/Sarajevo"
    });
}

module.exports = scheduleDailyCleanup