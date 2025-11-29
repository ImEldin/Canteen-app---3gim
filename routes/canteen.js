const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const canteenController = require('../controllers/canteenController');

router.use(requireAuth);
router.use(requireRole('kantina'));

router.get('/', canteenController.showDashboard);
router.get('/orders', canteenController.showOrders);

module.exports = router;