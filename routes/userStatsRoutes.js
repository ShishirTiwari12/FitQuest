const express = require("express");
const router = express.Router();
const { addScore } = require("../controllers/userStatsController");
const protectRoutes = require("../middlewares/protectRoutes");
const { getMyStats } = require("../controllers/userStatsController");

router.get("/me", protectRoutes, getMyStats);

router.post("/score", protectRoutes, addScore);

module.exports = router;
