// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { verifyEsewaPayment } = require("../controllers/paymentController");

// eSewa will redirect to this route after payment
router.get("/esewa/verify", verifyEsewaPayment);

module.exports = router;
