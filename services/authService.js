const userRepository = require('../repositories/userRepository');
const tempPasswordRepository = require('../repositories/tempPasswordRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
    async login(email, password) {
        try {
            if (!email || !password) throw new Error("Potrebni su email i lozinka.");

            const user = await userRepository.findByEmail(email);
            if (!user) {
                return { success: false, message: 'Korisnik nije pronađen.' };
            }

            if (user.is_locked) {
                const now = new Date();
                if (user.locked_until && now < user.locked_until) {
                    return { success: false, message: 'Nalog je zaključan. Pokušajte ponovo kasnije.' };
                } else {
                    await user.update({ is_locked: false, failed_login_attempts: 0, locked_until: null });
                }
            }

            if (user.isMsLogin && (user.password === null || user.password === undefined)) {
                return {
                    success: false,
                    message: 'Ovaj korisnički račun koristi isključivo Microsoft prijavu. Kontaktirajte administratora ako želite lokalnu lozinku.'
                };
            }

            if (user.banned) {
                return { success: false, message: 'Ovaj nalog je suspendovan.' };
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
                return { success: false, message: 'Pogrešna lozinka.' };
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
            throw new Error("Greška pri prijavi. Pokušajte ponovo.");
        }
    },

    async microsoftLogin(code) {
        try {
            if (!code) throw new Error("Nedostaje autorizacijski kod.");

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
                return { success: false, message: "Greška pri dohvaćanju Microsoft tokena." };
            }

            const tokenData = await response.json();
            const idToken = tokenData.id_token;

            if (!idToken) {
                return { success: false, message: "Microsoft nije vratio ID token." };
            }

            const decoded = jwt.decode(idToken);

            if (!decoded?.preferred_username) {
                return { success: false, message: "Nije moguće dobiti email sa Microsoft računa." };
            }

            const email = decoded.preferred_username;

            if (!email.endsWith("@treca-gimnazija.edu.ba")) {
                return { success: false, message: "Dozvoljene su samo školske email adrese." };
            }

            const username = email.split("@")[0];

            let user = await userRepository.findByEmail(email);

            if (user && user.is_locked) {
                const now = new Date();
                if (user.locked_until && now < user.locked_until) {
                    return { success: false, message: 'Nalog je zaključan. Pokušajte ponovo kasnije.' };
                } else {
                    await user.update({ is_locked: false, failed_login_attempts: 0, locked_until: null });
                }
            }

            if (user?.banned) {
                return { success: false, message: 'Ovaj nalog je suspendovan.' };
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
            throw new Error("Greška pri Microsoft prijavi. Pokušajte ponovo.");
        }
    },

    async changePassword(userId, oldPassword, newPassword) {
        try {
            if (!userId || !oldPassword || !newPassword) throw new Error("Svi parametri su obavezni.");

            const user = await userRepository.findById(userId);
            if (!user) {
                return { success: false, message: 'Korisnik nije pronađen.' };
            }

            const match = await bcrypt.compare(oldPassword, user.password);
            if (!match) {
                return { success: false, message: 'Stara lozinka nije ispravna.' };
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            await userRepository.updatePassword(userId, hashed);
            await tempPasswordRepository.deleteByEmail(user.email);

            return { success: true };
        } catch (err) {
            console.error(`Error changing password for user ${userId}:`, err);
            throw new Error("Greška pri promjeni lozinke.");
        }
    }
};
