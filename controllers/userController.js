module.exports = {
    showDashboard(req, res) {
        const user = req.session.user;
        res.render('user/dashboard', {user});
    }
}