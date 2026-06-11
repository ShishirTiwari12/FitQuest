const Expert = require("../models/Expert");
const SessionBooking = require("../models/SessionBooking");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// ─── Helper ───────────────────────────────────────────────────────────────────

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "fitquest/experts" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ─── Public Routes ────────────────────────────────────────────────────────────

// GET /api/experts
exports.getAllExperts = async (req, res) => {
  try {
    const experts = await Expert.find({ isActive: true })
      .select("-password")
      .lean();

    // Only expose unbooked slots to the client
    const cleaned = experts.map((e) => ({
      ...e,
      availableSlots: e.availableSlots.filter((s) => !s.isBooked),
    }));

    res.json({ experts: cleaned });
  } catch (err) {
    console.error("getAllExperts error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/experts/:id
exports.getExpertById = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id)
      .select("-password")
      .lean();
    if (!expert || !expert.isActive)
      return res.status(404).json({ message: "Expert not found." });

    expert.availableSlots = expert.availableSlots.filter((s) => !s.isBooked);
    res.json({ expert });
  } catch (err) {
    console.error("getExpertById error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// POST /api/admin/experts  — create an expert account
exports.createExpert = async (req, res) => {
  try {
    const { name, email, password, bio, specialization, hourlyRate } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !bio ||
      !specialization ||
      !hourlyRate
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await Expert.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ message: "Expert with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    let photo = { url: null, publicId: null };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      photo.url = result.secure_url;
      photo.publicId = result.public_id;
    }

    const expert = await Expert.create({
      name,
      email,
      password: hashedPassword,
      bio,
      specialization,
      hourlyRate: Number(hourlyRate),
      photo,
    });

    const { password: _, ...expertData } = expert.toObject();
    res.status(201).json({ message: "Expert created.", expert: expertData });
  } catch (err) {
    console.error("createExpert error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/admin/experts/:id/slots  — add available time slots
exports.addSlots = async (req, res) => {
  try {
    const { slots } = req.body;
    // slots: [{ date: "2026-03-15", startTime: "10:00", endTime: "11:00" }]

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: "Slots array is required." });
    }

    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    expert.availableSlots.push(...slots);
    await expert.save();

    res.json({
      message: `${slots.length} slot(s) added.`,
      availableSlots: expert.availableSlots,
    });
  } catch (err) {
    console.error("addSlots error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/admin/experts/:id/slots/:slotId — remove a slot
exports.removeSlot = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    expert.availableSlots = expert.availableSlots.filter(
      (s) => s._id.toString() !== req.params.slotId,
    );
    await expert.save();

    res.json({ message: "Slot removed." });
  } catch (err) {
    console.error("removeSlot error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── Expert Dashboard Auth ────────────────────────────────────────────────────

// POST /api/expert-auth/login
exports.expertLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const expert = await Expert.findOne({ email });
    if (!expert)
      return res.status(401).json({ message: "Invalid credentials." });

    const match = await bcrypt.compare(password, expert.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: expert._id, email: expert.email, name: expert.name },
      process.env.EXPERT_TOKEN_SECRET_KEY ||
        process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful.",
      token,
      expert: {
        id: expert._id,
        name: expert.name,
        email: expert.email,
        specialization: expert.specialization,
        photo: expert.photo,
      },
    });
  } catch (err) {
    console.error("expertLogin error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── Expert Dashboard Routes ──────────────────────────────────────────────────

// GET /api/expert-dashboard/sessions  — expert sees their confirmed bookings
exports.getExpertSessions = async (req, res) => {
  try {
    const sessions = await SessionBooking.find({
      expert: req.expert.id,
      bookingStatus: "CONFIRMED",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ sessions });
  } catch (err) {
    console.error("getExpertSessions error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/expert-dashboard/sessions/:id/zoom  — expert submits zoom link
exports.submitZoomLink = async (req, res) => {
  try {
    const { zoomLink } = req.body;
    if (!zoomLink)
      return res.status(400).json({ message: "Zoom link is required." });

    const booking = await SessionBooking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (booking.expert.toString() !== req.expert.id)
      return res.status(403).json({ message: "Not authorized." });

    booking.zoomLink = zoomLink;
    await booking.save();

    // Send zoom link email to user
    const { sendZoomLinkEmail } = require("../utils/sendSessionEmails");
    const Expert = require("../models/Expert");
    const expert = await Expert.findById(req.expert.id).select("name");

    await sendZoomLinkEmail(booking.userEmail, {
      userName: booking.userName,
      expertName: expert.name,
      date: booking.slot.date,
      startTime: booking.slot.startTime,
      endTime: booking.slot.endTime,
      zoomLink,
    });

    booking.zoomLinkSent = true;
    await booking.save();

    res.json({ message: "Zoom link saved and emailed to user." });
  } catch (err) {
    console.error("submitZoomLink error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.addMySlots = async (req, res) => {
  try {
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots) || slots.length === 0)
      return res.status(400).json({ message: "Slots array is required." });

    // Validate each slot
    for (const slot of slots) {
      if (!slot.date || !slot.startTime || !slot.endTime)
        return res
          .status(400)
          .json({
            message: "Each slot must have date, startTime, and endTime.",
          });
    }

    const expert = await Expert.findById(req.expert.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    expert.availableSlots.push(...slots);
    await expert.save();

    res.json({
      message: `${slots.length} slot(s) added successfully.`,
      availableSlots: expert.availableSlots,
    });
  } catch (err) {
    console.error("addMySlots error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/expert-dashboard/slots/:slotId  — expert deletes their own unbooked slot
exports.deleteMySlot = async (req, res) => {
  try {
    const expert = await Expert.findById(req.expert.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    const slot = expert.availableSlots.id(req.params.slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found." });

    if (slot.isBooked)
      return res
        .status(400)
        .json({ message: "Cannot delete a slot that is already booked." });

    expert.availableSlots = expert.availableSlots.filter(
      (s) => s._id.toString() !== req.params.slotId,
    );
    await expert.save();

    res.json({
      message: "Slot deleted successfully.",
      availableSlots: expert.availableSlots,
    });
  } catch (err) {
    console.error("deleteMySlot error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// GET /api/expert-dashboard/my-slots  — expert fetches their own slots
exports.getMySlots = async (req, res) => {
  try {
    const expert = await Expert.findById(req.expert.id).select(
      "availableSlots",
    );
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    res.json({ availableSlots: expert.availableSlots });
  } catch (err) {
    console.error("getMySlots error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
