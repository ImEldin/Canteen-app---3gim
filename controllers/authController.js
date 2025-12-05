const authService = require('../services/authService');
const querystring = require('querystring');

module.exports = {
    showLoginPage(req, res) {
        try {
            res.render('login', { error: null });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load login page.' });
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

            if (result.user.must_change_password) {
                return res.redirect('/auth/change-password');
            }

            switch (result.user.role) {
                case 'admin':
                    return res.redirect('/admin');
                case 'ucenik':
                case 'profesor':
                    return res.redirect('/user');
                case 'kantina':
                    return res.redirect('/canteen');
                default:
                    return res.redirect('/');
            }

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to login. Please try again later.' });
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
            return res.status(500).render('error', { message: 'Failed to start Microsoft login.' });
        }
    },

    async microsoftLoginCallback(req, res) {
        try {
            const { code, error, error_description } = req.query;

            if (error) {
                console.error('Microsoft OAuth error:', error, error_description);
                return res.render('login', { error: 'Microsoft login failed. Please try again.' });
            }

            if (!code) {
                return res.render('login', { error: 'Invalid login response from Microsoft.' });
            }

            const result = await authService.microsoftLogin(code);

            if (!result.success) {
                return res.render('login', { error: result.message || 'Microsoft login failed.' });
            }

            const user = result.user;

            req.session.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                must_change_password: user.must_change_password || false
            };

            switch (user.role) {
                case 'ucenik':
                case 'profesor':  return res.redirect('/user');
                case 'kantina':   return res.redirect('/canteen');
                default:          return res.redirect('/');
            }

        } catch (err) {
            console.error(err);
            return res.status(500).render('error', { message: 'Microsoft login failed. Please try again later.' });
        }
    },

    showChangePasswordPage(req, res) {
        try {
            if (!req.session.user) return res.redirect('/auth/login');
            res.render('change-password', { error: null });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load change password page.' });
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

            return res.redirect('/');

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to change password. Please try again later.' });
        }
    },

    logout(req, res) {
        try {
            req.session.destroy(() => {
                res.redirect('/auth/login');
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to logout.' });
        }
    }
};
