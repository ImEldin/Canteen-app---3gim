const { TempPassword } = require("../models");

module.exports = {
    saveTempPassword(email, password) {
        return TempPassword.create({ email, password });
    },

    deleteByEmail(email) {
        return TempPassword.destroy({
            where: { email }
        });
    },

    getAll() {
        return TempPassword.findAll();
    }
};
