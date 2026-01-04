const adminService = require('../services/adminService');

const VALID_ROLES = ["ucenik", "profesor", "kantina"];

module.exports = {
    showDashboard(req, res) {
        try {
            const user = req.session.user;
            res.render('admin/dashboard', { user });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri učitavanju početne stranice.' });
        }
    },

    async listUsers(req, res) {
        try {
            const user = req.session.user;
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
                hasMore,
                user
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri učitavanju korisnika.' });
        }
    },

    async userDetails(req, res) {
        try {
            const admin = req.session.user;
            const id = req.params.id;
            const user = await adminService.getUserDetails(id);

            if (!user) return res.status(404).render('error', { message: 'Korisnik nije pronađen.' });

            const successMessage = req.query.success || null;

            const tempPassword = req.session.tempPassword || null;
            delete req.session.tempPassword;

            res.render('admin/user-details', { user, admin , success: successMessage, tempPassword });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri učitavanju detalja korisnika.' });
        }
    },

    showCreateUserForm(req, res) {
        try {
            const user = req.session.user;

            const success = req.session.success;
            const error = req.session.error;
            const tempPassword = req.session.tempPassword;

            req.session.success = null;
            req.session.error = null;
            req.session.tempPassword = null;

            res.render("admin/create-user", {
                user,
                success,
                error,
                tempPassword
            });

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri učitavanju forme za kreiranje korisnika.' });
        }
    },

    async showEditUser(req, res) {
        try {
            const userId = req.params.id;
            const admin = req.session.user;
            const user = await adminService.getUserDetails(userId);

            if (!user) return res.status(404).render('error', { message: 'Korisnik nije pronađen.' });

            res.render('admin/edit-user', { user, error: null, admin});

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri učitavanju forme za uređivanje korisnika.' });
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
                return res.render('admin/edit-user', { user, error: result.message });
            }

            res.redirect(`/admin/user/${userId}?success=Korisnik je uspješno izmijenjen.`);

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri ažuriranju korisnika.' });
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
                req.session.error = result.message;
                return res.redirect("/admin/create-user");
            }

            req.session.success = "Korisnik je uspješno kreiran!";
            req.session.tempPassword = result.tempPassword;

            return res.redirect("/admin/create-user");

        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri kreiranju korisnika.' });
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
            res.status(500).render('error', { message: 'Greška pri izvozu privremenih lozinki.' });
        }
    },

    async lockUser(req, res) {
        try {
            await adminService.lockUser(req.params.id, req.body.minutes);
            res.redirect(`/admin/user/${req.params.id}?success=Korisnik je zaključan.`);
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri zaključavanju korisnika.' });
        }
    },

    async unlockUser(req, res) {
        try {
            await adminService.unlockUser(req.params.id);
            res.redirect(`/admin/user/${req.params.id}?success=Korisnik je otključan.`);
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri otključavanju korisnika.' });
        }
    },

    async resetPassword(req, res) {
        try {
            const result = await adminService.resetPassword(req.params.id);
            req.session.tempPassword = result.tempPassword;
            req.session.save(() => {
                res.redirect(`/admin/user/${req.params.id}?success=Lozinka uspješno resetovana.`);
            });
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri resetovanju lozinke.' });
        }
    },

    async deleteUser(req, res) {
        try {
            await adminService.deleteUser(req.params.id);
            res.redirect('/admin/manage-users');
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri brisanju korisnika.' });
        }
    },

    async banUser(req, res) {
        try {
            await adminService.banUser(req.params.id);
            res.redirect(`/admin/user/${req.params.id}?success=Korisnik je deaktiviran.`);
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri deaktiviranju korisnika.' });
        }
    },

    async unbanUser(req, res) {
        try {
            await adminService.unbanUser(req.params.id);
            res.redirect(`/admin/user/${req.params.id}?success=Korisnik je aktiviran.`);
        } catch (err) {
            console.error(err);
            res.status(500).render('error', { message: 'Greška pri aktiviranju korisnika.' });
        }
    },
};
