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
            throw new Error("Došlo je do greške prilikom dohvaćanja korisnika.");
        }
    },

    async findByEmail(email) {
        try {
            if (!email) throw new Error("Email je obavezan.");
            return await User.findOne({ where: { email } });
        } catch (err) {
            console.error(`Error finding user by email (${email}):`, err);
            throw new Error("Nije moguće pronaći korisnika prema emailu.");
        }
    },

    async findById(id) {
        try {
            if (!id) throw new Error("ID korisnika je obavezan.");
            return await User.findByPk(id);
        } catch (err) {
            console.error(`Error finding user by id (${id}):`, err);
            throw new Error("Nije moguće pronaći korisnika prema ID-u.");
        }
    },

    async updatePassword(id, hashedPassword) {
        try {
            if (!id || !hashedPassword) throw new Error("ID i lozinka su obavezni.");
            return await User.update(
                { password: hashedPassword, must_change_password: false },
                { where: { id } }
            );
        } catch (err) {
            console.error(`Error updating password for user ${id}:`, err);
            throw new Error("Nije moguće ažurirati lozinku.");
        }
    },

    async createUser({ email, username, password, role, phone_number }) {
        try {
            if (!email || !username || !password || !role) {
                throw new Error("Nedostaju obavezna polja za kreiranje korisnika.");
            }
            return await User.create({ email, username, phone_number, password, role });
        } catch (err) {
            console.error(`Error creating user (${email}):`, err);
            throw new Error("Nije moguće kreirati korisnika.");
        }
    },

    async createWithoutPassword({ email, username, role }) {
        try {
            if (!email || !username || !role) {
                throw new Error("Nedostaju obavezna polja za kreiranje korisnika.");
            }

            return await User.create({
                email,
                username,
                role,
                password: null,
                phone_number: null,
                must_change_password: false,
                isMsLogin: true
            });

        } catch (err) {
            console.error(`Error creating MS user (${email}):`, err);
            throw new Error("Nije moguće kreirati MS korisnika.");
        }
    },

    async updateUser(id, fields) {
        try {
            if (!id || !fields || Object.keys(fields).length === 0) {
                throw new Error("ID i podaci za ažuriranje su obavezni.");
            }
            return await User.update(fields, { where: { id } });
        } catch (err) {
            console.error(`Error updating user ${id}:`, err);
            throw new Error("Nije moguće ažurirati korisnika.");
        }
    },

    async deleteUser(id) {
        try {
            if (!id) throw new Error("ID korisnika je obavezan.");
            return await User.destroy({ where: { id } });
        } catch (err) {
            console.error(`Error deleting user ${id}:`, err);
            throw new Error("Nije moguće izbrisati korisnika.");
        }
    }
};
