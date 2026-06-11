const express = require("express");
const router = express.Router();
const protectRoutes = require("../middlewares/protectRoutes");
const PhotoReport = require("../models/PhotoReport");
const User = require("../models/User");

// POST /api/reports/photo
router.post("/photo", protectRoutes, async (req, res) => {
  try {
    const { username, challengeId, day } = req.body;

    const reportedUser = await User.findOne({ username });
    if (!reportedUser) {
      return res.status(404).json({
        successful: false,
        message: "User not found",
      });
    }

    if (reportedUser._id.toString() === req.user.id) {
      return res.status(400).json({
        successful: false,
        message: "You cannot report yourself",
      });
    }

    await PhotoReport.create({
      reportedUser: reportedUser._id,
      challengeId,
      day,
      reportedBy: req.user.id,
    });

    const FLAG_THRESHOLD = 3;
    const reportedUserId = reportedUser._id;

    // Count UNIQUE reporters for this user
    const uniqueReporters = await PhotoReport.distinct("reportedBy", {
      reportedUser: reportedUserId,
    });

    if (
      uniqueReporters.length >= FLAG_THRESHOLD &&
      reportedUser.accountStatus === "active"
    ) {
      await User.findByIdAndUpdate(reportedUserId, {
        accountStatus: "under_review",
        moderationNotes: "Auto-flagged due to multiple community reports",
      });
    }

    res.json({
      successful: true,
      message: "Report submitted",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        successful: false,
        message: "You already reported this photo",
      });
    }

    console.error("Report error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to report photo",
    });
  }
});

module.exports = router;
