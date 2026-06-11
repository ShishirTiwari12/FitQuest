// routes/sessionPaymentRoutes.js
const express = require("express");
const router = express.Router();
const protectRoutes = require("../middlewares/protectRoutes");
const {
  initiateSessionPayment,
  verifySessionPayment,
  getMySessions,
} = require("../controllers/sessionPaymentController");

// All routes require user to be logged in
router.post("/initiate", protectRoutes, initiateSessionPayment);
router.post("/verify", protectRoutes, verifySessionPayment);
router.get("/my-sessions", protectRoutes, getMySessions);

module.exports = router;
