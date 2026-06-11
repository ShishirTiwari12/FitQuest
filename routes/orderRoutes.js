const express = require("express");
const router = express.Router();
const {
  createOrder,
  createCartOrder,
  verifyPayment,
  getMyOrders,
} = require("../controllers/orderController");
const protectRoutes = require("../middlewares/protectRoutes");

// Single product order
router.post("/create", protectRoutes, createOrder);

// Cart order (multiple products)
router.post("/create-cart-order", protectRoutes, createCartOrder);

// Verify payment
router.post("/verify-payment", protectRoutes, verifyPayment);

// Get user's orders - NEW ROUTE
router.get("/my-orders", protectRoutes, getMyOrders);

module.exports = router;
