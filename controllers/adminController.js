const Admin = require("../models/Admin");
const User = require("../models/User");
const Expert = require("../models/Expert");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "fitquest/experts" },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

// ─── Admin Auth ───────────────────────────────────────────────────────────────

// POST /api/admin/auth/login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive)
      return res.status(401).json({ message: "Invalid credentials." });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
      process.env.ADMIN_TOKEN_SECRET_KEY,
      { expiresIn: "8h" },
    );

    res.json({
      message: "Login successful.",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("adminLogin error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/admin/auth/create-admin  (superadmin only)
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password)
      return res
        .status(400)
        .json({ message: "username, email and password are required." });

    const existing = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existing)
      return res
        .status(409)
        .json({ message: "Admin with this email or username already exists." });

    const admin = await Admin.create({
      username,
      email,
      password,
      role: role || "moderator",
    });

    res.status(201).json({
      message: "Admin account created.",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("createAdmin error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { accountStatus, moderationNotes } = req.body;
    const validStatuses = ["active", "under_review", "leaderboard_banned"];
    if (!validStatuses.includes(accountStatus))
      return res.status(400).json({ message: "Invalid account status." });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus, moderationNotes: moderationNotes || null },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ message: "User status updated.", user });
  } catch (err) {
    console.error("updateUserStatus error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/admin/users/:id  (superadmin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User deleted." });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── Expert Management ────────────────────────────────────────────────────────

// GET /api/admin/experts
exports.getAllExperts = async (req, res) => {
  try {
    const experts = await Expert.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ experts });
  } catch (err) {
    console.error("getAllExperts error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/admin/experts
exports.createExpert = async (req, res) => {
  try {
    const { name, email, password, bio, specialization, hourlyRate } = req.body;
    if (!name || !email || !password || !bio || !specialization || !hourlyRate)
      return res.status(400).json({ message: "All fields are required." });

    const existing = await Expert.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ message: "Expert with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    let photo = { url: null, publicId: null };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      photo = { url: result.secure_url, publicId: result.public_id };
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

// PATCH /api/admin/experts/:id
exports.updateExpert = async (req, res) => {
  try {
    const { name, bio, specialization, hourlyRate, isActive } = req.body;
    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(specialization && { specialization }),
        ...(hourlyRate && { hourlyRate }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true },
    ).select("-password");

    if (!expert) return res.status(404).json({ message: "Expert not found." });
    res.json({ message: "Expert updated.", expert });
  } catch (err) {
    console.error("updateExpert error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/admin/experts/:id  (superadmin only)
exports.deleteExpert = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    if (expert.photo?.publicId) {
      await cloudinary.uploader.destroy(expert.photo.publicId);
    }

    await expert.deleteOne();
    res.json({ message: "Expert deleted." });
  } catch (err) {
    console.error("deleteExpert error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// POST /api/admin/experts/:id/slots
exports.addExpertSlots = async (req, res) => {
  try {
    const { slots } = req.body;
    if (!slots || !Array.isArray(slots) || slots.length === 0)
      return res.status(400).json({ message: "Slots array is required." });

    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    expert.availableSlots.push(...slots);
    await expert.save();

    res.json({ message: `${slots.length} slot(s) added.` });
  } catch (err) {
    console.error("addExpertSlots error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

// GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const SessionBooking = require("../models/SessionBooking");

    const [totalUsers, totalExperts, totalSessions, confirmedSessions] =
      await Promise.all([
        User.countDocuments(),
        Expert.countDocuments({ isActive: true }),
        SessionBooking.countDocuments(),
        SessionBooking.countDocuments({ bookingStatus: "CONFIRMED" }),
      ]);

    res.json({
      stats: { totalUsers, totalExperts, totalSessions, confirmedSessions },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getExpertSlots = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id).select(
      "availableSlots name",
    );
    if (!expert) return res.status(404).json({ message: "Expert not found." });
    res.json({
      expertName: expert.name,
      availableSlots: expert.availableSlots,
    });
  } catch (err) {
    console.error("getExpertSlots error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// DELETE /api/admin/experts/:id/slots/:slotId
exports.deleteExpertSlot = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: "Expert not found." });

    const slot = expert.availableSlots.id(req.params.slotId);
    if (!slot) return res.status(404).json({ message: "Slot not found." });

    if (slot.isBooked)
      return res.status(400).json({ message: "Cannot delete a booked slot." });

    expert.availableSlots = expert.availableSlots.filter(
      (s) => s._id.toString() !== req.params.slotId,
    );
    await expert.save();

    res.json({
      message: "Slot deleted.",
      availableSlots: expert.availableSlots,
    });
  } catch (err) {
    console.error("deleteExpertSlot error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
