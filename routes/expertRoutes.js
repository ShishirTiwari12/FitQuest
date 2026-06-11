// ─────────────────────────────────────────────────────────────────────────────
// routes/expertRoutes.js  — public expert browsing
// ─────────────────────────────────────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const {
  getAllExperts,
  getExpertById,
} = require("../controllers/expertController");

router.get("/", getAllExperts);
router.get("/:id", getExpertById);

module.exports = router;
