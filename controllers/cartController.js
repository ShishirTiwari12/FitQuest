const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Get current user's cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      return res.status(200).json({ success: true, items: [] });
    }

    res.status(200).json({ success: true, items: cart.items });
    console.log("cart items are " + cart.items);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add product to cart
// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Product not in cart" });
    }

    item.quantity = quantity;

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Remove item
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((i) => i.product.toString() !== productId);

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
