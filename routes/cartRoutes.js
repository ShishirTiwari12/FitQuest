const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require("../controllers/cartController");

// Get current user's cart
router.get("/", getCart);

// Add product to cart
router.post("/add", addToCart);
// Update quantity of a cart item
router.put("/update", updateCartItem);

// Remove item from cart
router.delete("/remove/:productId", removeFromCart);

module.exports = router;
