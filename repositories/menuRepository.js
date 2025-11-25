const { MenuItem, Tag } = require("../models");

module.exports = {
    async getAllMenuItems() {
        return MenuItem.findAll({
            include: [{ model: Tag }]
        });
    },

    async getMenuItemById(id) {
        return MenuItem.findByPk(id);
    }
};