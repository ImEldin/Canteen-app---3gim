const { MenuItem, Tag } = require("../models");
const { sequelize } = require("../models");
const fs = require("fs/promises");
const path = require("path");

module.exports = {
    async getAllMenuItems(where = {}, tagWhere = {}, orderBy = null) {
        try {
            return await MenuItem.findAll({
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
        } catch (err) {
            console.error("Error fetching menu items:", err);
            throw new Error("Failed to fetch menu items.");
        }
    },

    async getMenuItemById(id) {
        try {
            return await MenuItem.findByPk(id);
        } catch (err) {
            console.error(`Error fetching menu item with id ${id}:`, err);
            throw new Error("Failed to fetch menu item.");
        }
    },

    async getAllTags() {
        try {
            return await Tag.findAll();
        } catch (err) {
            console.error("Error fetching tags:", err);
            throw new Error("Failed to fetch tags.");
        }
    },

    async saveMenu(items) {
        try {
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error("Menu items array is required and cannot be empty.");
            }

            await sequelize.transaction(async (t) => {
                await MenuItem.update({ is_active: false }, { where: {}, transaction: t });

                for (const item of items) {
                    const menuItem = await MenuItem.create(
                        {
                            name: item.name,
                            description: item.description,
                            price: item.price,
                            image_url: item.image || null,
                        },
                        { transaction: t }
                    );

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

        } catch (err) {
            console.error("Error saving menu:", err);
            throw new Error("Failed to save menu.");
        }
    },

    async deactivateMenu() {
        try {
            await MenuItem.update(
                { is_active: false },
                { where: {} }
            );
        } catch (err) {
            console.error("Error deactivating menu:", err);
            throw new Error("Failed to deactivate menu.");
        }
    },

    async deleteInactiveMenuItems() {
        try {
            const items = await MenuItem.findAll({ where: { is_active: false }, include: Tag });

            for (const item of items) {
                await item.setTags([]);

                if (item.image_url) {
                    const filePath = path.join(__dirname, "..", "public", item.image_url);

                    try {
                        await fs.unlink(filePath);
                        console.log("Deleted image:", filePath);
                    } catch (err) {
                        if (err.code !== "ENOENT") {
                            console.error("Failed to delete image:", filePath, err);
                        } else {
                            console.warn("Image not found, skipping:", filePath);
                        }
                    }
                }

            }

            await MenuItem.destroy({ where: { is_active: false } });
        } catch (err) {
            console.error("Error deleting inactive menu items:", err);
            throw new Error("Failed to delete inactive menu items.");
        }
    }

};
