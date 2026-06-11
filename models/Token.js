const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user_id: { type: mongoose.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 },
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
