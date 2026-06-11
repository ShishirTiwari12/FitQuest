const express = require("express");
const router = express.Router();

const User = require("../models/User");
const UserStats = require("../models/UserStats");
const PhotoReport = require("../models/PhotoReport");
const scoreRules = require("../constants/scoreRules");
const sendModerationEmail = require("../utils/sendModerationEmail");

const { getUserChallenges } = require("../controllers/moderationController");
const protectAdmin = require("../middlewares/protectAdmin").protectAdmin;

// ------------------ GET /reported-users ------------------
// Returns users under review with number of reports
// GET /api/moderation/reported-users
router.get(
  "/reported-users",
  protectAdmin,

  async (req, res) => {
    try {
      // Aggregate reports per user
      const reports = await PhotoReport.aggregate([
        {
          $group: {
            _id: "$reportedUser",
            totalReports: { $sum: 1 },
            uniqueReporters: { $addToSet: "$reportedBy" },
          },
        },
        { $sort: { totalReports: -1 } },
      ]);

      // Populate user info
      const populated = await User.populate(reports, {
        path: "_id",
        select: "username accountStatus email",
      });

      // Filter out reports where the user was deleted
      const filtered = populated.filter((r) => r._id !== null);

      const formatted = filtered.map((r) => ({
        userId: r._id._id,
        username: r._id.username,
        email: r._id.email,
        accountStatus: r._id.accountStatus,
        totalReports: r.totalReports,
        uniqueReporters: r.uniqueReporters.length,
      }));

      res.json({ successful: true, data: formatted });
    } catch (err) {
      console.error("Reported users fetch error:", err);
      res
        .status(500)
        .json({ successful: false, message: "Failed to fetch reported users" });
    }
  },
);
// ------------------ POST /resolve/:userId ------------------
// Moderator resolves reports as reasonable
router.post(
  "/resolve/:userId",
  protectAdmin,

  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ successful: false, message: "User not found" });

      if (user.accountStatus !== "under_review") {
        return res
          .status(400)
          .json({ successful: false, message: "User not under review" });
      }

      const stats = await UserStats.findOne({ user: user._id });
      if (!stats)
        return res
          .status(404)
          .json({ successful: false, message: "User stats not found" });

      // ----------------- Calculate deductions -----------------
      const photoChallenges = stats.completedChallenges.filter(
        (c) => c.type === "photo",
      );
      const normalChallenges = stats.completedChallenges.filter(
        (c) => c.type === "normal",
      );

      const photoDeduction = photoChallenges.length * scoreRules.PHOTO_UPLOAD;
      const normalDeduction = Math.floor(
        (normalChallenges.length * scoreRules.CHALLENGE_COMPLETE) / 5,
      );
      const totalDeduction = photoDeduction + normalDeduction;

      stats.score = Math.max(0, stats.score - totalDeduction);
      await stats.save();

      // ----------------- Reset user account -----------------
      user.accountStatus = "active";
      user.moderationNotes = `Moderator confirmed reports. Deducted ${totalDeduction} points.`;
      await user.save();

      // ----------------- Remove related reports -----------------
      await PhotoReport.deleteMany({ reportedUser: user._id });

      // ----------------- Send moderation email -----------------
      const emailBody = `
        <p>Hello ${user.username},</p>
        <p>
          Our moderation team has reviewed the reports against your account.
          As a result, your score has been reduced by <strong>${totalDeduction} points</strong>:
        </p>
        <ul>
          <li>Photo uploads deducted: ${photoDeduction} points</li>
          <li>Partial normal challenges deducted: ${normalDeduction} points</li>
        </ul>
        <p>Please ensure that all future uploads are authentic to avoid further penalties.</p>
        <p>Regards,<br/>FitQuest Team</p>
      `;

      await sendModerationEmail(
        user.email,
        "Moderation Report - Score Deduction",
        emailBody,
      );

      res.json({
        successful: true,
        message: "User review resolved and score deducted",
        totalDeduction,
      });
    } catch (err) {
      console.error("Moderation resolve error:", err);
      res.status(500).json({
        successful: false,
        message: "Failed to resolve user reports",
      });
    }
  },
);

router.get("/user-challenges/:userId", protectAdmin, async (req, res) => {
  await getUserChallenges(req, res);
});

// DELETE /api/moderation/dismiss/:userId
// Clears all reports without penalizing the user
router.delete("/dismiss/:userId", protectAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ successful: false, message: "User not found" });

    await PhotoReport.deleteMany({ reportedUser: userId });

    user.accountStatus = "active";
    user.moderationNotes = "Reports dismissed by moderator. No action taken.";
    await user.save();

    res.json({
      successful: true,
      message: "All reports dismissed successfully.",
    });
  } catch (err) {
    console.error("Dismiss reports error:", err);
    res
      .status(500)
      .json({ successful: false, message: "Failed to dismiss reports." });
  }
});

module.exports = router;
