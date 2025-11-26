const { MenuItem, Tag } = require("../models");

module.exports = {
    async getAllMenuItems(where, tagWhere, orderBy) {
        return MenuItem.findAll({
            where,  // this is only for fields on MenuItem
            include: [
                {
                    model: Tag,
                    where: tagWhere,
                    required: Object.keys(tagWhere).length > 0   // only apply matching if a tag search exists
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