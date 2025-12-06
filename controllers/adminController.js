const adminService = require('../services/adminService');

const VALID_ROLES = ["ucenik", "profesor", "kantina"];

module.exports = {
    showDashboard(req, res) {
        try {
            const user = req.session.user;
            console.log(user);
            res.render('admin/dashboard', { user });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load dashboard.' });
        }
    },

    async listUsers(req, res) {
        try {
            const adminId = req.session.user.id;

            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 20;

            const filters = {
                email: req.query.email || "",
                role: req.query.role || "",
                username: req.query.username || ""
            };

            const { users, hasMore } = await adminService.getAllUsers({
                page,
                pageSize,
                filters,
                excludeUserId: adminId
            });

            res.render('admin/manage-users', {
                users,
                filters,
                page,
                pageSize,
                hasMore
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load users.' });
        }
    },

    async userDetails(req, res) {
        try {
            const id = req.params.id;
            const user = await adminService.getUserDetails(id);

            if (!user) return res.status(404).render('error', { message: 'User not found.' });

            res.render('admin/user-details', { user });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load user details.' });
        }
    },

    showCreateUserForm(req, res) {
        try {
            const user = req.session.user;
            res.render('admin/create-user', { error: null, tempPassword: null, user });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load create user form.' });
        }
    },

    async showEditUser(req, res) {
        try {
            const userId = req.params.id;
            const user = await adminService.getUserDetails(userId);

            if (!user) return res.status(404).render('error', { message: 'User not found.' });

            res.render('admin/editUser', { user, error: null });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to load edit user form.' });
        }
    },

    async handleEditUser(req, res) {
        try {
            const userId = req.params.id;

            if (!VALID_ROLES.includes(req.body.role)) {
                req.body.role = "ucenik";
            }

            const data = {
                email: req.body.email,
                username: req.body.username,
                phone_number: req.body.phone_number,
                role: req.body.role
            };

            const result = await adminService.updateUser(userId, data);

            if (result && !result.success) {
                const user = await adminService.getUserDetails(userId);
                return res.render('admin/editUser', { user, error: result.message });
            }

            res.redirect(`/admin/user/${userId}`);

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to update user.' });
        }
    },

    async handleCreateUser(req, res) {
        try {
            if (!VALID_ROLES.includes(req.body.role)) {
                req.body.role = "ucenik";
            }

            const { email, username, role, phone_number } = req.body;

            const result = await adminService.createUser({ email, username, role, phone_number });

            if (!result.success) {
                return res.render('admin/create-user', { error: result.message, tempPassword: null });
            }

            res.render('admin/user-created', { error: null, tempPassword: result.tempPassword });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to create user.' });
        }
    },

    async exportTempPasswords(req, res) {
        try {
            const workbook = await adminService.exportTempPasswords();

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="temp-passwords.xlsx"'
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to export temporary passwords.' });
        }
    },

    async lockUser(req, res) {
        try {
            await adminService.lockUser(req.params.id, req.body.minutes);
            res.redirect('/admin/manage-users');
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to lock user.' });
        }
    },

    async unlockUser(req, res) {
        try {
            await adminService.unlockUser(req.params.id);
            res.redirect('/admin/manage-users');
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to unlock user.' });
        }
    },

    async resetPassword(req, res) {
        try {
            const result = await adminService.resetPassword(req.params.id);
            res.render('admin/password-reset', { tempPassword: result.tempPassword });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to reset password.' });
        }
    },

    async deleteUser(req, res) {
        try {
            await adminService.deleteUser(req.params.id);
            res.redirect('/admin/manage-users');
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to delete user.' });
        }
    },

    async banUser(req, res) {
        try {
            await adminService.banUser(req.params.id);
            res.redirect('/admin/manage-users');
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to ban user.' });
        }
    },

    async unbanUser(req, res) {
        try {
            await adminService.unbanUser(req.params.id);
            res.redirect('/admin/manage-users');
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Failed to unban user.' });
        }
    },
};
