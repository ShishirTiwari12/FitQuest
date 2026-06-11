const mongoose = require("mongoose");

const sessionBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expert",
      required: true,
    },
    slot: {
      date: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    amount: { type: Number, required: true },
    transaction_uuid: { type: String, required: true, unique: true },
    paymentStatus: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED"],
      default: "INITIATED",
    },
    esewaRefId: { type: String, default: null },
    bookingStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },
    zoomLink: { type: String, default: null },
    zoomLinkSent: { type: Boolean, default: false },
    confirmationEmailSent: { type: Boolean, default: false },
    // user's email snapshot at time of booking (so expert can see it)
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
  },
  { timestamps: true },
);

const SessionBooking = mongoose.model("SessionBooking", sessionBookingSchema);
module.exports = SessionBooking;
