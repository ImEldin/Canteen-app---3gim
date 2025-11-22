const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole(['user', 'kantina', 'profesor']));

router.get('/', (req, res) => {
    const { role, email } = req.session.user;
    res.render('dashboard', { role, email });
});

module.exports = router;
