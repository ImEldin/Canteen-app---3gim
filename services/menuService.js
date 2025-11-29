const menuRepository = require("../repositories/menuRepository");
const {Op} = require("sequelize");

module.exports = {
    async getMenuItems(filters) {

        const where = {};
        const tagWhere = {};

        if(filters.tag){
           tagWhere.name = { [Op.iLike]: `%${filters.tag}%` };
        }

        if(filters.name){
            where.name = { [Op.iLike]: `%${filters.name}%` };
        }

        return Promise.all([
            menuRepository.getAllMenuItems(where, tagWhere, filters.orderBy),
            menuRepository.getAllTags()
        ]);
    },

    async getMenuItemById(id) {
        return await menuRepository.getMenuItemById(id);
    },

    async createMenu(items) {
        console.log(items);
        if (!items || items.length === 0)
            throw new Error("No menu items provided");

        return await menuRepository.saveMenu(items);
    },

    async deactivateMenu() {
        return await menuRepository.deactivateMenu();
    },

    async deleteMenu() {
        return await menuRepository.deleteMenu();
    }
};
