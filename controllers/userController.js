module.exports = {
    showDashboard(req, res) {
        try {
            const user = req.session.user;
            res.render('user/dashboard', { user, error: null });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load dashboard.' });
        }
    }
};