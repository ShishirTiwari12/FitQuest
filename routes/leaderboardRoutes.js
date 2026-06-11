const express = require("express");
const router = express.Router();
const protectRoutes = require("../middlewares/protectRoutes");
const {
  getMyRank,
  getTopLeaderboard,
} = require("../controllers/leaderboardController");

// GET /api/leaderboard
router.get("/", protectRoutes, getTopLeaderboard);

// GET /api/leaderboard/my-rank
router.get("/my-rank", protectRoutes, getMyRank);

module.exports = router;
