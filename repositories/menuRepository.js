const { MenuItem, Tag } = require("../models");

module.exports = {
    async getAllMenuItems(where, tagWhere, orderBy) {
        return MenuItem.findAll({
            where,
            include: [
                {
                    model: Tag,
                    where: tagWhere,
                    required: Object.keys(tagWhere).length > 0
                }
            ],
            ...(orderBy && { order: orderBy })
        });
    },

    async getMenuItemById(id) {
        return MenuItem.findByPk(id);
    },

    async getAllTags() {
        return Tag.findAll();
    }
};