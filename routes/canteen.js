const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const canteenController = require('../controllers/canteenController');
const menuController = require('../controllers/menuController');

router.use(requireAuth);
router.use(requireRole('kantina'));

router.get('/', canteenController.showDashboard);
router.get('/orders', canteenController.showOrders);
router.post("/orders/toggle-status/:id", canteenController.toggleOrderStatus);
router.get("/menu", menuController.getMenu);
router.post("/menu", canteenController.uploadMiddleware, canteenController.createMenu);
router.post("/menu/delete", canteenController.deactivateMenu);
router.post('/orders/complete/:slot', canteenController.completeBreak);

module.exports = router;