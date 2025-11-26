const menuRepository = require("../repositories/menuRepository");
const {Op} = require("sequelize");

module.exports = {
    getMenuItems(filters) {

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

    getMenuItemById(id) {
        return menuRepository.getMenuItemById(id);
    }
};
