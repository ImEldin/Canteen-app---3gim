const { MenuItem, Tag } = require("../models");
const { sequelize } = require("../models");

module.exports = {
    async getAllMenuItems(where, tagWhere, orderBy) {
        return MenuItem.findAll({
            where: { ...where, is_active: true },
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
    },

    async saveMenu(items) {
        return await sequelize.transaction(async function (t) {

            await MenuItem.update({ is_active: false }, { where: {}, transaction: t });

            for (const item of items) {
                const menuItem = await MenuItem.create({
                    name: item.name,
                    description: item.description,
                    price: item.price
                }, { transaction: t });

                if (item.tags && item.tags.length > 0) {
                    for (const tagId of item.tags) {
                        const tag = await Tag.findByPk(tagId, { transaction: t });
                        if (tag) {
                            await menuItem.addTag(tag, { transaction: t });
                        }
                    }
                }
            }
        });
    },

    async deactivateMenu() {
        await MenuItem.update(
            { is_active: false },
            { where: {} }
        );
    },

    async deleteMenu() {
        const items = await MenuItem.findAll({ include: Tag });
        for (const item of items) {
            await item.setTags([]);
        }
        await MenuItem.destroy({ where: {} });
    }
};