const express = require("express");
const router = express.Router();
const realtimeController = require("../controllers/realtimeController");
const { requireAuth } = require("../middleware/auth");

router.get("/sse", requireAuth, realtimeController.connect);

module.exports = router;
