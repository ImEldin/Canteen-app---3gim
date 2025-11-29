const authService = require('../services/authService');

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
