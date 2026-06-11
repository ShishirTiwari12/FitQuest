const Expert = require("../models/Expert");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /api/expert-auth/login
exports.expertLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const expert = await Expert.findOne({ email });
    if (!expert || !expert.isActive)
      return res.status(401).json({ message: "Invalid credentials." });

    const match = await bcrypt.compare(password, expert.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: expert._id, email: expert.email, name: expert.name },
      process.env.EXPERT_TOKEN_SECRET_KEY,
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
