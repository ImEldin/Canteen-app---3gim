const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', adminController.showDashboard);

router.get('/manage-users', adminController.listUsers);
router.get('/create-user', adminController.showCreateUserForm);
router.post('/create-user', adminController.handleCreateUser);

router.get("/user/:id", adminController.userDetails);
router.get("/user/edit/:id", adminController.showEditUser);
router.post('/user/edit/:id', adminController.handleEditUser);

router.post('/lock/:id', adminController.lockUser);
router.post('/unlock/:id', adminController.unlockUser);
router.post('/reset-password/:id', adminController.resetPassword);
router.post('/delete/:id', adminController.deleteUser);

router.get("/export-temp-passwords", adminController.exportTempPasswords);

module.exports = router;