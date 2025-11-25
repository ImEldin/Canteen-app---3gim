const menuRepository = require("../repositories/menuRepository");

module.exports = {
    getMenuItems() {
        return menuRepository.getAllMenuItems()
    },

    getMenuItemById(id) {
        return menuRepository.getMenuItemById(id);
    }
};
