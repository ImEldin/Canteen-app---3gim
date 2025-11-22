const authService = require('../services/authService');

module.exports = {
    showLoginPage(req, res) {
        res.render('login', { error: null });
    },

    async login(req, res) {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        if (!result.success) {
            return res.render('login', { error: result.message });
        }

        req.session.user = {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            must_change_password: result.user.must_change_password
        };

        if (result.user.must_change_password) {
            return res.redirect('/auth/change-password');
        }

        if (result.user.role === 'admin') {
            return res.redirect('/admin');
        }

        return res.redirect('/dashboard');
    },

    showChangePasswordPage(req, res) {
        if (!req.session.user) return res.redirect('/auth/login');
        res.render('change-password', { error: null });
    },

    async changePassword(req, res) {
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
    },

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/auth/login');
        });
    }
};