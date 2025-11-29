const menuRepository = require("../repositories/menuRepository");
const { Op } = require("sequelize");

module.exports = {
    async getMenuItems(filters = {}) {
        try {
            const where = {};
            const tagWhere = {};

            if (filters.tag) {
                tagWhere.name = { [Op.iLike]: `%${filters.tag}%` };
            }

            if (filters.name) {
                where.name = { [Op.iLike]: `%${filters.name}%` };
            }

            return await Promise.all([
                menuRepository.getAllMenuItems(where, tagWhere, filters.orderBy),
                menuRepository.getAllTags()
            ]);
        } catch (err) {
            console.error("Error fetching menu items:", err);
            throw new Error("Failed to fetch menu items.");
        }
    },

    async getMenuItemById(id) {
        try {
            if (!id) throw new Error("Menu item ID is required.");
            return await menuRepository.getMenuItemById(id);
        } catch (err) {
            console.error(`Error fetching menu item ${id}:`, err);
            throw new Error("Failed to fetch menu item.");
        }
    },

    async createMenu(items) {
        try {
            if (!items || items.length === 0) throw new Error("No menu items provided.");
            return await menuRepository.saveMenu(items);
        } catch (err) {
            console.error("Error creating menu:", err);
            throw new Error("Failed to create menu.");
        }
    },

    async deactivateMenu() {
        try {
            return await menuRepository.deactivateMenu();
        } catch (err) {
            console.error("Error deactivating menu:", err);
            throw new Error("Failed to deactivate menu.");
        }
    },
};
