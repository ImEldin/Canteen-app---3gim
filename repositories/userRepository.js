const { User } = require('../models');

module.exports = {
    getAllUsers({ where, offset, limit }) {

        return User.findAll({
            where,
            order: [['email', 'ASC']],
            offset,
            limit
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

    createUser({ email, username, password, role, phone_number }) {
        return User.create({
            email,
            username,
            phone_number,
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