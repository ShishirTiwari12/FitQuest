const express = require("express");
const router = express.Router();
const protectRoutes = require("../middlewares/protectRoutes"); // your existing user auth
const {
  bookSession,
  verifySessionPayment,
  getMySessions,
} = require("../controllers/sessionController");

router.post("/book", protectRoutes, bookSession);
router.post("/verify-payment", protectRoutes, verifySessionPayment);
router.get("/my-sessions", protectRoutes, getMySessions);

module.exports = router;
