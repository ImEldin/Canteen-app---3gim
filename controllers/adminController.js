const adminService = require('../services/adminService');

module.exports = {
    showDashboard(req, res) {
        res.render('admin/dashboard');
    },

    async listUsers(req, res) {

        const adminId = req.session.user.id;

        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;

        const filters = {
            email: req.query.email || "",
            role: req.query.role || "",
            username: req.query.username || ""
        };

        const { users, hasMore } = await adminService.getAllUsers(
            {
                page,
                pageSize,
                filters,
                excludeUserId: adminId
            }
        );

        res.render('admin/manage-users', {
            users,
            filters,
            page,
            pageSize,
            hasMore
        });
    },

    async userDetails(req, res) {
        const id = req.params.id;

        const user = await adminService.getUserDetails(id);
        if (!user) return res.status(404).send("User not found");

        res.render("admin/user-details", { user });
    },

    showCreateUserForm(req, res) {
        res.render('admin/create-user', { error: null, tempPassword: null });
    },

    async showEditUser(req, res) {
        const userId = req.params.id;
        const user = await adminService.getUserDetails(userId);

        if (!user) return res.status(404).send("User not found");

        res.render(`admin/editUser`, { user });

    },

    async handleEditUser(req, res) {
        const VALID_ROLES = ["user", "profesor", "kantina"];

        const userId = req.params.id;

        if (!VALID_ROLES.includes(req.body.role)) {
            req.body.role = "user";
        }

        const data = {
            email: req.body.email,
            username: req.body.username,
            phone: req.body.phone,
            role: req.body.role
        };

        await adminService.updateUser(userId, data);

        res.redirect(`/admin/user/${userId}`);
    },

    async handleCreateUser(req, res) {
        const VALID_ROLES = ["user", "profesor", "kantina"];

        if (!VALID_ROLES.includes(req.body.role)) {
            req.body.role = "user";
        }

        const { email, username, role, phone_number } = req.body;

        try {
            const result = await adminService.createUser({ email, username, role, phone_number});

            if (!result.success) {
                return res.render('admin/create-user', { error: result.message, tempPassword: null });
            }

            res.render('admin/user-created', { error: null, tempPassword: result.tempPassword });

        } catch (err) {
            res.render('admin/create-user', { error: err.message, tempPassword: null });
        }
    },

    async lockUser(req, res) {
        await adminService.lockUser(req.params.id, req.body.minutes);
        res.redirect('/admin/manage-users');
    },

    async unlockUser(req, res) {
        await adminService.unlockUser(req.params.id);
        res.redirect('/admin/manage-users');
    },

    async resetPassword(req, res) {
        const result = await adminService.resetPassword(req.params.id);
        res.render('admin/password-reset', { tempPassword: result.tempPassword });
    },

    async deleteUser(req, res) {
        await adminService.deleteUser(req.params.id);
        res.redirect('/admin/manage-users');
    }
};
