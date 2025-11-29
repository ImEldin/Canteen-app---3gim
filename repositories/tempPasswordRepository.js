const { TempPassword } = require("../models");

module.exports = {
    async saveTempPassword(email, password) {
        try {
            if (!email || !password) {
                throw new Error("Email and password are required.");
            }

            return await TempPassword.create({ email, password });
        } catch (err) {
            console.error(`Error saving temp password for ${email}:`, err);
            throw new Error("Failed to save temporary password.");
        }
    },

    async deleteByEmail(email) {
        try {
            if (!email) {
                throw new Error("Email is required.");
            }

            return await TempPassword.destroy({
                where: { email }
            });
        } catch (err) {
            console.error(`Error deleting temp password for ${email}:`, err);
            throw new Error("Failed to delete temporary password.");
        }
    },

    async getAll() {
        try {
            return await TempPassword.findAll();
        } catch (err) {
            console.error("Error fetching temporary passwords:", err);
            throw new Error("Failed to fetch temporary passwords.");
        }
    }
};
