const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const menuController = require("../controllers/menuController")

router.use(requireAuth);
router.use(requireRole(['ucenik', 'profesor']));

router.get('/', userController.showDashboard);
router.get("/menu", menuController.showMenu);
router.get("/menu/add/:id", menuController.addToCart);
router.get("/menu/remove/:id", menuController.removeFromCart);
router.post("/menu/confirm", menuController.confirmOrder);
router.get("/orders", menuController.showOrders);
router.post("/orders/:id/delete", menuController.deleteOrder);


module.exports = router;