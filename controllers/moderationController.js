// controllers/moderationController.js
const User = require("../models/User");
const UserStats = require("../models/UserStats");

exports.getUserChallenges = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        successful: false,
        message: "User not found",
      });
    }

    const stats = await UserStats.findOne({ user: user._id }).lean();

    res.json({
      successful: true,
      user: {
        username: user.username,
        email: user.email,
        accountStatus: user.accountStatus,
      },
      challenges: stats?.completedChallenges || [],
    });
  } catch (err) {
    console.error("Fetch user challenges error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to fetch user challenges",
    });
  }
};
