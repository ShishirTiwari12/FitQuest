const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user_email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 15 * 60 },
});

const PasswordResetToken = mongoose.model(
  "passwordResetToken",
  passwordResetTokenSchema
);
module.exports = PasswordResetToken;
