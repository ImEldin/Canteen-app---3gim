const userRepository = require('../repositories/userRepository');
const tempPasswordRepository = require('../repositories/tempPasswordRepository');
const bcrypt = require('bcrypt');

module.exports = {
    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        if (user.is_locked) {
            const now = new Date();
            if (user.locked_until && now < user.locked_until) {
                return { success: false, message: 'Account is locked. Try again later.' };
            } else {
                await user.update({ is_locked: false, failed_login_attempts: 0, locked_until: null });
            }
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            let attempts = user.failed_login_attempts + 1;
            const updateData = { failed_login_attempts: attempts };

            if (attempts >= 5) {
                updateData.is_locked = true;
                updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000);
            }

            await user.update(updateData);
            return { success: false, message: 'Incorrect password' };
        }

        await user.update({
            failed_login_attempts: 0,
            is_locked: false,
            locked_until: null,
            last_login_at: new Date()
        });

        return { success: true, user };
    },

    async changePassword(userId, oldPassword, newPassword) {
        const user = await userRepository.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
            return { success: false, message: 'Old password incorrect' };
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await userRepository.updatePassword(userId, hashed);
        await tempPasswordRepository.deleteByEmail(user.email);

        return { success: true };
    }
};
