module.exports = {
    requireAuth(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/auth/login');
        }
        next();
    },

    requireRole(role) {
        return (req, res, next) => {
            if (!req.session || !req.session.user) {
                return res.redirect('/auth/login');
            }

            const userRole = req.session.user.role;

            if (Array.isArray(role)) {
                if (!role.includes(userRole)) return res.status(403).send('Forbidden');
            } else {
                if (userRole !== role) return res.status(403).send('Forbidden');
            }

            next();
        };
    }
};