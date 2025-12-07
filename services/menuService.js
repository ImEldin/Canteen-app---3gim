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
            throw new Error("Nije moguće dohvatiti stavke menija.");
        }
    },

    async getMenuItemById(id) {
        try {
            if (!id) throw new Error("ID stavka menija je obavezna.");
            return await menuRepository.getMenuItemById(id);
        } catch (err) {
            console.error(`Error fetching menu item ${id}:`, err);
            throw new Error("Nije moguće dohvatiti stavku menija.");
        }
    },

    async createMenu(items) {
        try {
            if (!items || items.length === 0) throw new Error("Nijedna stavka menija nije dostavljena.");
            return await menuRepository.saveMenu(items);
        } catch (err) {
            console.error("Error creating menu:", err);
            throw new Error("Nije moguće kreirati meni.");
        }
    },

    async deactivateMenu() {
        try {
            return await menuRepository.deactivateMenu();
        } catch (err) {
            console.error("Error deactivating menu:", err);
            throw new Error("Nije moguće deaktivirati meni.");
        }
    },
};
