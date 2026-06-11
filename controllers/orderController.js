const Order = require("../models/Order");
const Cart = require("../models/Cart"); // Assuming you have a Cart model
const {
  generateEsewaSignature,
  verifyEsewaSignature,
  ESEWA_PRODUCT_CODE,
} = require("../utils/esewa");
const axios = require("axios");

const ESewaConfig = {
  merchantCode: "EPAYTEST",
  successUrl: "http://localhost:3000/payment/success",
  failureUrl: "http://localhost:3000/payment/failure",
};

// Create Order for single product (existing functionality)
const createOrder = async (req, res) => {
  try {
    const { productId } = req.body;

    // Fetch product price
    const Product = require("../models/Product");
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const totalAmount = product.price.toFixed(2);
    const transaction_uuid = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create order in DB
    const order = await Order.create({
      user: req.user.id,
      product: productId,
      amount: totalAmount,
      transaction_uuid,
      status: "INITIATED",
      orderType: "single",
    });

    // Generate HMAC SHA-256 signature
    const signature = generateEsewaSignature(
      totalAmount,
      transaction_uuid,
      ESEWA_PRODUCT_CODE,
    );

    res.status(200).json({
      success: true,
      orderId: order._id,
      amount: totalAmount,
      transaction_uuid,
      signature,
      merchantCode: ESEWA_PRODUCT_CODE,
      successUrl: ESewaConfig.successUrl,
      failureUrl: ESewaConfig.failureUrl,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create Order for cart (multiple products) - NEW FUNCTION
const createCartOrder = async (req, res) => {
  try {
    const { items } = req.body; // items: [{ productId, quantity, price }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Calculate total amount
    const totalAmount = items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);

    const transaction_uuid = `CART-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create order items array
    const orderItems = items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    // Create order in DB
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      amount: totalAmount,
      transaction_uuid,
      status: "INITIATED",
      orderType: "cart",
    });

    // Generate HMAC SHA-256 signature
    const signature = generateEsewaSignature(
      totalAmount,
      transaction_uuid,
      ESEWA_PRODUCT_CODE,
    );

    res.status(200).json({
      success: true,
      orderId: order._id,
      amount: totalAmount,
      transaction_uuid,
      signature,
      merchantCode: ESEWA_PRODUCT_CODE,
      successUrl: ESewaConfig.successUrl,
      failureUrl: ESewaConfig.failureUrl,
    });
  } catch (err) {
    console.error("Create cart order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify payment using eSewa Status Check API
const verifyPayment = async (req, res) => {
  try {
    const {
      transaction_uuid,
      transaction_code,
      total_amount,
      product_code,
      signature,
    } = req.body;

    // Find order
    const order = await Order.findOne({ transaction_uuid });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Call eSewa Status Check API to verify
    const statusUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;

    const response = await axios.get(statusUrl);
    const data = response.data;

    console.log("eSewa Status Check Response:", data);

    if (data.status === "COMPLETE") {
      order.status = "SUCCESS";
      order.ref_id = data.ref_id;
      order.transaction_code = transaction_code;
      await order.save();

      // Clear user's cart after successful payment
      if (order.orderType === "cart") {
        try {
          await Cart.findOneAndUpdate(
            { user: req.user.id },
            { $set: { items: [] } },
          );
          console.log("Cart cleared after successful payment");
        } catch (cartErr) {
          console.error("Error clearing cart:", cartErr);
          // Don't fail the whole request if cart clearing fails
        }
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully!",
        order,
      });
    } else {
      order.status = data.status || "FAILED";
      await order.save();

      return res.status(400).json({
        success: false,
        message: `Payment status: ${data.status}`,
      });
    }
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: err.message,
    });
  }
};

// Add this function to your orderController.js

const getMyOrders = async (req, res) => {
  try {
    // Fetch all orders for the current user
    const orders = await Order.find({ user: req.user.id })
      .populate("product", "name image price") // Populate single product details
      .populate("items.product", "name image price") // Populate cart items product details
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// Export this along with your other functions
module.exports = {
  createOrder,
  createCartOrder,
  verifyPayment,
  getMyOrders, // Add this
};
