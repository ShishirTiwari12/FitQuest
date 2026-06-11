const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For single product orders (backward compatibility)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    // For cart/multiple product orders
    items: [orderItemSchema],
    amount: {
      type: Number,
      required: true,
    },
    transaction_uuid: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED", "PENDING", "COMPLETE"],
      default: "INITIATED",
    },
    ref_id: {
      type: String,
    },
    transaction_code: {
      type: String,
    },
    orderType: {
      type: String,
      enum: ["single", "cart"],
      default: "single",
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
