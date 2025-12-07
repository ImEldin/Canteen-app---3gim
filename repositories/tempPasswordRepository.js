const { TempPassword } = require("../models");

module.exports = {
    async saveTempPassword(email, password) {
        try {
            if (!email || !password) {
                throw new Error("Email i lozinka su obavezni.");
            }

            return await TempPassword.create({ email, password });
        } catch (err) {
            console.error(`Error saving temp password for ${email}:`, err);
            throw new Error("Nije moguće spremiti privremenu lozinku.");
        }
    },

    async deleteByEmail(email) {
        try {
            if (!email) {
                throw new Error("Greška: email je obavezan.");
            }

            return await TempPassword.destroy({
                where: { email }
            });
        } catch (err) {
            console.error(`Error deleting temp password for ${email}:`, err);
            throw new Error("Nije moguće obrisati privremenu lozinku.");
        }
    },

    async getByEmail(email) {
        try {
            if (!email) {
                throw new Error("Email je obavezan.");
            }

            return await TempPassword.findOne({
                where: { email }
            });
        } catch (err) {
            console.error(`Error fetching temp password for ${email}:`, err);
            throw new Error("Nije moguće dohvatiti privremenu lozinku.");
        }
    },

    async getAll() {
        try {
            return await TempPassword.findAll();
        } catch (err) {
            console.error("Error fetching temporary passwords:", err);
            throw new Error("Nije moguće dohvatiti privremene lozinke.");
        }
    }
};
