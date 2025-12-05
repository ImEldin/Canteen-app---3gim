const { User } = require('../models');

module.exports = {
    async getAllUsers({ where = {}, offset = 0, limit = 20 }) {
        try {
            return await User.findAll({
                where,
                order: [['email', 'ASC']],
                offset,
                limit
            });
        } catch (err) {
            console.error("Error fetching users:", err);
            throw new Error("Failed to fetch users.");
        }
    },

    async findByEmail(email) {
        try {
            if (!email) throw new Error("Email is required.");
            return await User.findOne({ where: { email } });
        } catch (err) {
            console.error(`Error finding user by email (${email}):`, err);
            throw new Error("Failed to find user by email.");
        }
    },

    async findById(id) {
        try {
            if (!id) throw new Error("User ID is required.");
            return await User.findByPk(id);
        } catch (err) {
            console.error(`Error finding user by id (${id}):`, err);
            throw new Error("Failed to find user by ID.");
        }
    },

    async updatePassword(id, hashedPassword) {
        try {
            if (!id || !hashedPassword) throw new Error("ID and password are required.");
            return await User.update(
                { password: hashedPassword, must_change_password: false },
                { where: { id } }
            );
        } catch (err) {
            console.error(`Error updating password for user ${id}:`, err);
            throw new Error("Failed to update password.");
        }
    },

    async createUser({ email, username, password, role, phone_number }) {
        try {
            if (!email || !username || !password || !role) {
                throw new Error("Missing required user fields.");
            }
            return await User.create({ email, username, phone_number, password, role });
        } catch (err) {
            console.error(`Error creating user (${email}):`, err);
            throw new Error("Failed to create user.");
        }
    },

    async createWithoutPassword({ email, username, role }) {
        try {
            if (!email || !username || !role) {
                throw new Error("Missing required user fields.");
            }

            return await User.create({
                email,
                username,
                role,
                password: null,
                phone_number: null,
                must_change_password: false
            });

        } catch (err) {
            console.error(`Error creating MS user (${email}):`, err);
            throw new Error("Failed to create MS user.");
        }
    },

    async updateUser(id, fields) {
        try {
            if (!id || !fields || Object.keys(fields).length === 0) {
                throw new Error("ID and fields are required to update user.");
            }
            return await User.update(fields, { where: { id } });
        } catch (err) {
            console.error(`Error updating user ${id}:`, err);
            throw new Error("Failed to update user.");
        }
    },

    async deleteUser(id) {
        try {
            if (!id) throw new Error("User ID is required.");
            return await User.destroy({ where: { id } });
        } catch (err) {
            console.error(`Error deleting user ${id}:`, err);
            throw new Error("Failed to delete user.");
        }
    }
};
