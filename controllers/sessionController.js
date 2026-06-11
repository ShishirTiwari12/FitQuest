const SessionBooking = require("../models/SessionBooking");
const Expert = require("../models/Expert");
const User = require("../models/User");
const {
  generateEsewaSignature,
  ESEWA_PRODUCT_CODE,
} = require("../utils/esewa");
const {
  sendSessionConfirmationEmail,
  sendExpertBookingNotification,
} = require("../utils/sendSessionEmails");
const axios = require("axios");

const SUCCESS_URL = "http://localhost:3000/session-payment/success";
const FAILURE_URL = "http://localhost:3000/session-payment/failure";

// POST /api/sessions/book
exports.bookSession = async (req, res) => {
  try {
    const { expertId, slotId } = req.body;

    if (!expertId || !slotId)
      return res
        .status(400)
        .json({ message: "expertId and slotId are required." });

    // Find expert and the chosen slot
    const expert = await Expert.findById(expertId);
    if (!expert || !expert.isActive)
      return res.status(404).json({ message: "Expert not found." });

    const slot = expert.availableSlots.id(slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found." });
    if (slot.isBooked)
      return res.status(409).json({
        message: "This slot is already booked. Please choose another.",
      });

    // Fetch user details for email snapshot
    const user = await User.findById(req.user.id).select("email username");
    if (!user) return res.status(404).json({ message: "User not found." });

    const amount = expert.hourlyRate.toFixed(2);
    const transaction_uuid = `SESSION-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create booking in INITIATED state
    await SessionBooking.create({
      user: req.user.id,
      expert: expertId,
      slot: {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      amount: expert.hourlyRate,
      transaction_uuid,
      paymentStatus: "INITIATED",
      bookingStatus: "PENDING",
      userEmail: user.email,
      userName: user.username,
    });

    // Generate eSewa signature
    const signature = generateEsewaSignature(
      amount,
      transaction_uuid,
      ESEWA_PRODUCT_CODE,
    );

    res.status(200).json({
      success: true,
      payment_url: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      form_data: {
        amount,
        tax_amount: "0",
        total_amount: amount,
        transaction_uuid,
        product_code: ESEWA_PRODUCT_CODE,
        product_service_charge: "0",
        product_delivery_charge: "0",
        success_url: SUCCESS_URL,
        failure_url: FAILURE_URL,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    });
  } catch (err) {
    console.error("bookSession error:", err);
    res.status(500).json({ message: "Server error while initiating booking." });
  }
};

// POST /api/sessions/verify-payment
exports.verifySessionPayment = async (req, res) => {
  try {
    const { transaction_uuid, transaction_code, total_amount, product_code } =
      req.body;

    const booking = await SessionBooking.findOne({ transaction_uuid });
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // Call eSewa Status Check API
    const statusUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
    const response = await axios.get(statusUrl);
    const data = response.data;

    console.log("eSewa session payment status:", data);

    if (data.status === "COMPLETE") {
      // Mark payment and booking as confirmed
      booking.paymentStatus = "SUCCESS";
      booking.bookingStatus = "CONFIRMED";
      booking.esewaRefId = data.ref_id || transaction_code;

      // Lock the slot on the expert document
      const expert = await Expert.findById(booking.expert);
      const slot = expert.availableSlots.find(
        (s) =>
          s.date === booking.slot.date &&
          s.startTime === booking.slot.startTime &&
          s.endTime === booking.slot.endTime &&
          !s.isBooked,
      );
      if (slot) {
        slot.isBooked = true;
        await expert.save();
      }

      await booking.save();

      // Send confirmation email to user
      try {
        await sendSessionConfirmationEmail(booking.userEmail, {
          userName: booking.userName,
          expertName: expert.name,
          specialization: expert.specialization,
          date: booking.slot.date,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
          amount: booking.amount,
        });
        booking.confirmationEmailSent = true;
        await booking.save();
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }

      // Notify expert of new booking
      try {
        await sendExpertBookingNotification(expert.email, {
          expertName: expert.name,
          userName: booking.userName,
          userEmail: booking.userEmail,
          date: booking.slot.date,
          startTime: booking.slot.startTime,
          endTime: booking.slot.endTime,
        });
      } catch (emailErr) {
        console.error("Failed to send expert notification:", emailErr);
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified. Session confirmed!",
        booking,
      });
    } else {
      booking.paymentStatus = "FAILED";
      await booking.save();

      return res.status(400).json({
        success: false,
        message: `Payment failed with status: ${data.status}`,
      });
    }
  } catch (err) {
    console.error("verifySessionPayment error:", err);
    res
      .status(500)
      .json({ message: "Server error during payment verification." });
  }
};

// GET /api/sessions/my-sessions
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await SessionBooking.find({ user: req.user.id })
      .populate("expert", "name specialization photo hourlyRate")
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (err) {
    console.error("getMySessions error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
