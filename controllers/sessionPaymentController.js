// controllers/sessionPaymentController.js
const axios = require("axios");
const SessionBooking = require("../models/SessionBooking");
const Expert = require("../models/Expert");
const {
  generateEsewaSignature,
  ESEWA_PRODUCT_CODE,
} = require("../utils/esewa");
const {
  sendSessionConfirmationEmail,
  sendExpertBookingNotification,
} = require("../utils/sendSessionEmails");

const BASE_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/session-payment/initiate
// Creates a SessionBooking and returns eSewa form data
// ─────────────────────────────────────────────────────────────────────────────
exports.initiateSessionPayment = async (req, res) => {
  try {
    const { expertId, slotId } = req.body;

    if (!expertId || !slotId)
      return res
        .status(400)
        .json({ success: false, message: "expertId and slotId are required." });

    // Find expert and the specific slot
    const expert = await Expert.findById(expertId);
    if (!expert || !expert.isActive)
      return res
        .status(404)
        .json({ success: false, message: "Expert not found." });

    const slot = expert.availableSlots.id(slotId);
    if (!slot)
      return res
        .status(404)
        .json({ success: false, message: "Slot not found." });
    if (slot.isBooked)
      return res
        .status(400)
        .json({ success: false, message: "This slot is already booked." });

    const totalAmount = parseFloat(expert.hourlyRate).toFixed(2);
    const transaction_uuid = `SESSION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Snapshot user info at booking time
    const User = require("../models/User");
    const user = await User.findById(req.user.id).select("email username");

    // Create booking record in INITIATED state
    const booking = await SessionBooking.create({
      user: req.user.id,
      expert: expertId,
      slot: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      amount: totalAmount,
      transaction_uuid,
      paymentStatus: "INITIATED",
      bookingStatus: "PENDING",
      userEmail: user.email,
      userName: user.username,
    });

    // Generate eSewa signature
    const signature = generateEsewaSignature(
      totalAmount,
      transaction_uuid,
      ESEWA_PRODUCT_CODE,
    );

    res.status(200).json({
      success: true,
      bookingId: booking._id,
      payment_url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      form_data: {
        amount: totalAmount,
        tax_amount: "0",
        total_amount: totalAmount,
        transaction_uuid,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: `${BASE_URL}/session-payment/success`, // ← new dedicated page
        failure_url: `${BASE_URL}/session-payment/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    });
  } catch (err) {
    console.error("initiateSessionPayment error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/session-payment/verify
// Called by frontend after eSewa redirects to success page
// ─────────────────────────────────────────────────────────────────────────────
exports.verifySessionPayment = async (req, res) => {
  try {
    const { transaction_uuid, transaction_code, total_amount, product_code } =
      req.body;

    if (!transaction_uuid)
      return res
        .status(400)
        .json({ success: false, message: "transaction_uuid is required." });

    // Find the booking
    const booking = await SessionBooking.findOne({ transaction_uuid });
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });

    // Prevent double-verification
    if (booking.paymentStatus === "SUCCESS")
      return res
        .status(200)
        .json({ success: true, message: "Already verified.", booking });

    // Call eSewa Status Check API
    const statusUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code || ESEWA_PRODUCT_CODE}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;

    const esewaResponse = await axios.get(statusUrl);
    const esewaData = esewaResponse.data;

    console.log("eSewa session status response:", esewaData);

    if (esewaData.status === "COMPLETE") {
      // ── Payment confirmed: lock the slot and confirm booking ───────────────
      booking.paymentStatus = "SUCCESS";
      booking.bookingStatus = "CONFIRMED";
      booking.esewaRefId = esewaData.ref_id || transaction_code;
      await booking.save();

      // Lock the slot on the expert document
      // Remove the booked slot entirely so it disappears from the expert's profile
      await Expert.updateOne(
        { _id: booking.expert },
        {
          $pull: {
            availableSlots: {
              date: booking.slot.date,
              startTime: booking.slot.startTime,
            },
          },
        },
      );

      // Send confirmation emails (non-blocking)
      try {
        const expert = await Expert.findById(booking.expert).select(
          "name email specialization",
        );
        await sendSessionConfirmationEmail(booking, expert);
        await sendExpertBookingNotification(booking, expert);
        booking.confirmationEmailSent = true;
        await booking.save();
      } catch (emailErr) {
        console.error("Email sending failed (non-critical):", emailErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Session booked successfully!",
        booking,
      });
    } else {
      // Payment failed or pending
      booking.paymentStatus = "FAILED";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: `Payment status: ${esewaData.status}`,
      });
    }
  } catch (err) {
    console.error("verifySessionPayment error:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed.",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/session-payment/my-sessions
// Returns all bookings for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await SessionBooking.find({ user: req.user.id })
      .populate("expert", "name specialization photo hourlyRate")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("getMySessions error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch sessions." });
  }
};
