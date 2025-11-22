const { User } = require('../models');
const { Op } = require('sequelize');

module.exports = {
    getAllUsers(excludeUserId) {
        const where = excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {};
        return User.findAll({
            where,
            order: [['email', 'ASC']]
        });
    },

    findByEmail(email) {
        return User.findOne({ where: { email } });
    },

    findById(id) {
        return User.findByPk(id);
    },

    updatePassword(id, hashedPassword) {
        return User.update(
            { password: hashedPassword, must_change_password: false },
            { where: { id } }
        );
    },

    createUser({ email, username, password, role }) {
        return User.create({
            email,
            username,
            password,
            role
        });
    },

    updateUser(id, fields) {
        return User.update(fields, { where: { id } });
    },

    deleteUser(id) {
        return User.destroy({ where: { id } });
    }
};