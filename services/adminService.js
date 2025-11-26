const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { Op } = require('sequelize');

function generateTempPassword() {
    return crypto.randomBytes(4).toString('base64')
        .replace(/\+/g,'A')
        .replace(/\//g,'B')
        .slice(0,6);
}

module.exports = {

    async getAllUsers({page, pageSize, filters, excludeUserId}) {

        const where = {};

        if (filters.email) {
            where.email = { [Op.iLike]: `%${filters.email}%` };
        }

        if (filters.username) {
            where.username = { [Op.iLike]: `%${filters.username}%` };
        }

        if (filters.role) {
            where.role = filters.role;
        }

        where.id = { [Op.ne]: excludeUserId };

        const offset = (page - 1) * pageSize;

        const result = await userRepository.getAllUsers({
            where,
            offset,
            limit: pageSize + 1
        });

        const hasMore = result.length > pageSize;

        return {
            users: result.slice(0, pageSize),
            hasMore
        };
    },

    async getUserDetails(userId) {
        return await userRepository.findById(userId);
    },

    async createUser({ email, username, role, phone_number}) {
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            return { success: false, message: 'Email already exists' };
        }

        const tempPassword = generateTempPassword();
        const hashed = await bcrypt.hash(tempPassword, 10);

        const user = await userRepository.createUser({
            email,
            username,
            phone_number,
            password: hashed,
            role,
        });

        return { success: true, user, tempPassword };
    },

    async updateUser(userId, data) {
        await userRepository.updateUser(userId, data);
    },

    async lockUser(userId, minutes) {
        const lockedUntil = new Date(Date.now() + minutes*60000);
        await userRepository.updateUser(userId, { is_locked: true, locked_until: lockedUntil });
    },

    async unlockUser(userId) {
        await userRepository.updateUser(userId, { is_locked: false, locked_until: null, failed_login_attempts: 0 });
    },

    async resetPassword(userId) {
        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await userRepository.updateUser(userId, { password: hashedPassword, must_change_password: true });
        return { tempPassword };
    },

    async deleteUser(userId) {
        await userRepository.deleteUser(userId);
    }
};