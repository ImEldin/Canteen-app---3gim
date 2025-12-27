const authService = require('../services/authService');
const querystring = require('querystring');

module.exports = {
    showLoginPage(req, res) {
        try {
            const success = req.query.success || null;
            res.render('login', { error: null, success });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješno učitavanje stranice za prijavu.' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password);

            if (!result.success) {
                return res.render('login', { error: result.message });
            }

            req.session.user = {
                id: result.user.id,
                email: result.user.email,
                username: result.user.username,
                role: result.user.role,
                must_change_password: result.user.must_change_password
            };

            req.session.save(err => {
                if (err) {
                    console.error("Session save error:", err);
                    return res.render('login', { error: "Došlo je do greške. Molimo pokušajte ponovo." });
                }

                if (result.user.must_change_password) {
                    return res.redirect('/auth/change-password');
                }

                switch (result.user.role) {
                    case 'admin':   return res.redirect('/admin');
                    case 'ucenik':
                    case 'profesor': return res.redirect('/user');
                    case 'kantina':  return res.redirect('/canteen');
                    default:         return res.redirect('/');
                }
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješna prijava. Pokušajte ponovo kasnije.' });
        }
    },

    async microsoftLoginRedirect(req, res) {
        try {
            const params = querystring.stringify({
                client_id: process.env.CLIENT_ID,
                response_type: 'code',
                redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
                response_mode: 'query',
                scope: 'openid profile email User.Read'
            });

            const tenant = process.env.TENANT_ID;

            const url = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;

            return res.redirect(url);

        } catch (err) {
            console.error(err);
            return res.status(500).render('error', { message: 'Neuspješno pokretanje Microsoft prijave.' });
        }
    },

    async microsoftLoginCallback(req, res) {
        try {
            const { code, error, error_description } = req.query;

            if (error) {
                console.error('Microsoft OAuth error:', error, error_description);
                return res.render('login', { error: 'Microsoft prijava nije uspjela. Pokušajte ponovo.' });
            }

            if (!code) {
                return res.render('login', { error: 'Microsoft prijava je vratila neispravan odgovor.' });
            }

            const result = await authService.microsoftLogin(code);

            if (!result.success) {
                return res.render('login', { error: result.message || 'Microsoft prijava nije uspjela.' });
            }

            const user = result.user;

            req.session.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                must_change_password: user.must_change_password || false
            };

            req.session.save(err => {
                if (err) {
                    console.error("Session save error:", err);
                    return res.render('login', { error: "Došlo je do greške. Molimo pokušajte ponovo." });
                }

                switch (user.role) {
                    case 'ucenik':
                    case 'profesor': return res.redirect('/user');
                    case 'kantina':  return res.redirect('/canteen');
                    default:         return res.redirect('/');
                }
            });

        } catch (err) {
            console.error(err);
            return res.status(500).render('error', { message: 'Microsoft prijava nije uspjela. Pokušajte ponovo kasnije.' });
        }
    },

    showChangePasswordPage(req, res) {
        try {
            if (!req.session.user) return res.redirect('/auth/login');
            res.render('change-password', { error: null });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješno učitavanje stranice za promjenu šifre.' });
        }
    },

    async changePassword(req, res) {
        try {
            const userId = req.session.user?.id;
            if (!userId) return res.redirect('/auth/login');

            const { oldPassword, newPassword } = req.body;

            const result = await authService.changePassword(
                userId,
                oldPassword,
                newPassword
            );

            if (!result.success) {
                return res.render('change-password', { error: result.message });
            }

            req.session.user.must_change_password = false;

            return res.redirect(
                '/auth/login?success=Šifra je uspješno promijenjena.'
            );

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješna promjena šifre. Pokušajte ponovo kasnije.' });
        }
    },

    logout(req, res) {
        try {
            req.session.destroy(() => {
                res.redirect('/auth/login');
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Neuspješno odjavljivanje.' });
        }
    }
};
