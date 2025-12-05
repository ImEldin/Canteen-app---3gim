const userRepository = require('../repositories/userRepository');
const tempPasswordRepository = require('../repositories/tempPasswordRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    async login(email, password) {
        try {
            if (!email || !password) throw new Error("Email and password are required.");

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

            if (user.isMsLogin && (user.password === null || user.password === undefined)) {
                return {
                    success: false,
                    message: 'This account uses Microsoft login only. Contact an admin to set a local password.'
                };
            }

            if (user.banned) {
                return { success: false, message: 'This account has been banned.' };
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                let attempts = (user.failed_login_attempts || 0) + 1;
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
        } catch (err) {
            console.error("Error during login:", err);
            throw new Error("Failed to login. Please try again.");
        }
    },

    async microsoftLogin(code) {
        try {
            if (!code) throw new Error("Authorization code is required.");

            const response = await fetch(
                `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        client_id: process.env.CLIENT_ID,
                        client_secret: process.env.CLIENT_SECRET,
                        grant_type: "authorization_code",
                        code,
                        redirect_uri: process.env.MICROSOFT_REDIRECT_URI
                    })
                }
            );

            if (!response.ok) {
                console.error(await response.text());
                return { success: false, message: "Failed to get Microsoft tokens." };
            }

            const tokenData = await response.json();
            const idToken = tokenData.id_token;

            if (!idToken) {
                return { success: false, message: "Microsoft did not return an ID token." };
            }

            const decoded = jwt.decode(idToken);

            if (!decoded?.preferred_username) {
                return { success: false, message: "Unable to retrieve email from Microsoft account." };
            }

            const email = decoded.preferred_username;

            if (!email.endsWith("@treca-gimnazija.edu.ba")) {
                return { success: false, message: "Only school accounts are allowed." };
            }

            const username = email.split("@")[0];

            let user = await userRepository.findByEmail(email);
            console.log(user)

            if (user && user.is_locked) {
                const now = new Date();
                if (user.locked_until && now < user.locked_until) {
                    return { success: false, message: 'Account is locked. Try again later.' };
                } else {
                    await user.update({ is_locked: false, failed_login_attempts: 0, locked_until: null });
                }
            }

            if (user.banned) {
                return { success: false, message: 'This account has been banned.' };
            }

            if (!user) {
                user = await userRepository.createWithoutPassword({
                    email,
                    username,
                    role: "ucenik",
                });
            }


            return { success: true, user };

        } catch (err) {
            console.error("Microsoft login error:", err);
            throw new Error("Microsoft login failed. Please try again.");
        }
    },

    async changePassword(userId, oldPassword, newPassword) {
        try {
            if (!userId || !oldPassword || !newPassword) throw new Error("All parameters are required.");

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
        } catch (err) {
            console.error(`Error changing password for user ${userId}:`, err);
            throw new Error("Failed to change password.");
        }
    }
};
