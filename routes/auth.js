const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.showLoginPage);
router.post('/login', authController.login);

router.get('/login/microsoft', authController.microsoftLoginRedirect);
router.get('/microsoft/callback', authController.microsoftLoginCallback);

router.get('/change-password', authController.showChangePasswordPage);
router.post('/change-password', authController.changePassword);

router.get('/logout', authController.logout);

module.exports = router;