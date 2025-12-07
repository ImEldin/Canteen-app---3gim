const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const tempPasswordRepository = require('../repositories/tempPasswordRepository');
const { Op } = require('sequelize');
const ExcelJS = require("exceljs");

function generateTempPassword() {
    return crypto.randomBytes(4).toString('base64')
        .replace(/\+/g,'A')
        .replace(/\//g,'B')
        .slice(0,6);
}

module.exports = {

    async getAllUsers({ page = 1, pageSize = 20, filters = {}, excludeUserId }) {
        try {
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
        } catch (err) {
            console.error("Error getting all users:", err);
            throw new Error("Greška pri učitavanju liste korisnika.");
        }
    },

    async getUserDetails(userId) {
        try {
            if (!userId) throw new Error("Greška: nedostaje ID korisnika.");
            return await userRepository.findById(userId);
        } catch (err) {
            console.error(`Error fetching user details for ${userId}:`, err);
            throw new Error("Greška pri učitavanju detalja korisnika.");
        }
    },

    async createUser({ email, username, role, phone_number }) {
        try {
            if (!email || !username || !role) throw new Error("Greška: nedostaju obavezna polja.");

            const existing = await userRepository.findByEmail(email);
            if (existing) {
                return { success: false, message: 'Email već postoji' };
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

            const temp = tempPasswordRepository.getByEmail(email);
            if (temp) {
                await tempPasswordRepository.deleteByEmail(email);
            }

            await tempPasswordRepository.saveTempPassword(email, tempPassword);

            return { success: true, user, tempPassword };
        } catch (err) {
            console.error("Error creating user:", err);
            throw new Error("Greška pri kreiranju korisnika.");
        }
    },

    async updateUser(userId, data) {
        try {
            if (!userId || !data) throw new Error("Greška: potreban je ID korisnika i podaci.");
            await userRepository.updateUser(userId, data);
        } catch (err) {
            console.error(`Error updating user ${userId}:`, err);
            throw new Error("Greška pri ažuriranju korisnika.");
        }
    },

    async lockUser(userId, minutes) {
        try {
            if (!userId || !minutes) throw new Error("Greška: potreban je ID korisnika i trajanje zaključavanja.");
            const lockedUntil = new Date(Date.now() + parseInt(minutes, 10) * 60000);
            await userRepository.updateUser(userId, { is_locked: true, locked_until: lockedUntil});
        } catch (err) {
            console.error(`Error locking user ${userId}:`, err);
            throw new Error("Greška pri zaključavanju korisnika.");
        }
    },

    async unlockUser(userId) {
        try {
            if (!userId) throw new Error("Greška: nedostaje ID korisnika.");
            await userRepository.updateUser(userId, { is_locked: false, locked_until: null, failed_login_attempts: 0 });
        } catch (err) {
            console.error(`Error unlocking user ${userId}:`, err);
            throw new Error("Greška pri otključavanju korisnika.");
        }
    },

    async resetPassword(userId) {
        try {
            if (!userId) throw new Error("Greška: nedostaje ID korisnika.");

            const tempPassword = generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            await userRepository.updateUser(userId, { password: hashedPassword, must_change_password: true });

            return { tempPassword };
        } catch (err) {
            console.error(`Error resetting password for user ${userId}:`, err);
            throw new Error("Greška pri resetovanju lozinke.");
        }
    },

    async deleteUser(userId) {
        try {
            if (!userId) throw new Error("Greška: nedostaje ID korisnika.");
            await userRepository.deleteUser(userId);
        } catch (err) {
            console.error(`Error deleting user ${userId}:`, err);
            throw new Error("Greška pri brisanju korisnika.");
        }
    },

    async banUser(userId) {
        try {
            if (!userId) throw new Error("Greška: nedostaje ID korisnika.");

            await userRepository.updateUser(userId, { banned: true });
        } catch (err) {
            console.error(`Error banning user ${userId}:`, err);
            throw new Error("Greška pri deaktivaciji korisnika.");
        }
    },

    async unbanUser(userId) {
        try {
            if (!userId) throw new Error("Greška: nedostaje ID korisnika.");

            await userRepository.updateUser(userId, { banned: false });
        } catch (err) {
            console.error(`Error unbanning user ${userId}:`, err);
            throw new Error("Greška pri aktivaciji korisnika.");
        }
    },

    async exportTempPasswords() {
        try {
            const records = await tempPasswordRepository.getAll();

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Temp Passwords");

            sheet.addRow(["ID", "Email", "Password"]);

            for (const row of records) {
                sheet.addRow([row.id, row.email, row.password]);
            }

            sheet.getRow(1).font = { bold: true };

            sheet.columns.forEach(column => {
                let maxLength = 10;
                column.eachCell({ includeEmpty: true }, cell => {
                    const length = cell.value ? cell.value.toString().length : 10;
                    if (length > maxLength) maxLength = length;
                });
                column.width = maxLength + 2;
            });

            return workbook;
        } catch (err) {
            console.error("Error exporting temp passwords:", err);
            throw new Error("Greška pri izvozu privremenih lozinki.");
        }
    }
};
