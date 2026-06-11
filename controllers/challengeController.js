const UserStats = require("../models/UserStats");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const FitnessPlan = require("../models/FitnessPlan");

exports.completeChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { day, challengeId, type } = req.body;

    if (!day || !challengeId || !type) {
      return res.status(400).json({
        successful: false,
        message: "Missing challenge data",
      });
    }

    // -------------------
    // FETCH USER PLAN
    // -------------------
    const plan = await FitnessPlan.findOne({ user_id: userId });
    if (!plan) {
      return res.status(400).json({
        successful: false,
        message: "Fitness plan not found",
      });
    }

    const startDate = new Date(plan.startDate || plan.createdAt);
    startDate.setHours(0, 0, 0, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allowedDay =
      Math.floor((todayStart - startDate) / (1000 * 60 * 60 * 24)) + 1;

    if (Number(day) !== allowedDay) {
      return res.status(403).json({
        successful: false,
        message:
          Number(day) < allowedDay
            ? "This challenge is missed"
            : "You can only complete today's challenges",
      });
    }

    // -------------------
    // FIND OR CREATE STATS
    // -------------------
    let stats = await UserStats.findOne({ user: userId });
    if (!stats) {
      stats = new UserStats({
        user: userId,
        score: 0,
        challengesCompleted: 0,
        photoUploads: 0,
        completedChallenges: [],
        streak: 0,
        longestStreak: 0,
        perfectDays: 0,
        lastActiveDate: null,
      });
    }

    // -------------------
    // PREVENT DOUBLE COMPLETION
    // -------------------
    const alreadyCompleted = stats.completedChallenges.find(
      (c) => c.day === allowedDay && c.challengeId === challengeId,
    );
    if (alreadyCompleted) {
      return res.json({
        successful: false,
        message: "Challenge already completed",
        score: stats.score,
      });
    }

    const normalizedType = type === "photo" ? "photo" : "normal";
    const basePoints = normalizedType === "photo" ? 10 : 5;
    let photoUrl = null;

    // -------------------
    // PHOTO UPLOAD
    // -------------------
    if (normalizedType === "photo") {
      if (!req.file) {
        return res.status(400).json({
          successful: false,
          message: "Photo file missing",
        });
      }

      const streamUpload = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "fitQuest" },
            (error, result) => (result ? resolve(result) : reject(error)),
          );
          stream.end(req.file.buffer);
        });

      const result = await streamUpload();
      photoUrl = result.secure_url;
    }

    // -------------------
    // CHECK ACCOUNT STATUS
    // -------------------
    const user = await User.findById(userId);
    if (!user || user.accountStatus !== "active") {
      return res.status(403).json({
        successful: false,
        message: "Account under review. Points disabled temporarily.",
      });
    }

    // -------------------
    // SAVE COMPLETION
    // -------------------
    stats.completedChallenges.push({
      day: allowedDay,
      challengeId,
      type: normalizedType,
      photoUrl,
      completedAt: new Date(),
    });

    stats.score += basePoints;
    stats.challengesCompleted += 1;
    if (normalizedType === "photo") stats.photoUploads += 1;

    // -------------------
    // 🔥 STREAK LOGIC (fixed)
    // -------------------
    let isNewDayForStreak = false;
    let streakBonus = 0;

    const lastActive = stats.lastActiveDate
      ? new Date(stats.lastActiveDate)
      : null;

    // Normalize lastActive to midnight so date diff is exact
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    // Only update streak once per calendar day (first challenge of the day)
    const alreadyActiveToday =
      lastActive && lastActive.getTime() === todayStart.getTime();

    if (!alreadyActiveToday) {
      isNewDayForStreak = true;

      if (!lastActive) {
        // First ever challenge — start streak at 1
        stats.streak = 1;
      } else {
        // How many calendar days since last active?
        const diffDays = Math.round(
          (todayStart.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          // Consecutive day — increment streak
          stats.streak += 1;
        } else {
          // Gap in days — reset streak
          stats.streak = 1;
        }
      }

      stats.lastActiveDate = new Date();

      if (stats.streak > stats.longestStreak) {
        stats.longestStreak = stats.streak;
      }

      // Streak milestone bonuses
      if (stats.streak === 3) streakBonus = 10;
      if (stats.streak === 7) streakBonus = 25;
      if (stats.streak === 14) streakBonus = 50;
      if (stats.streak === 30) streakBonus = 100;
      stats.score += streakBonus;
    }

    // -------------------
    // 🎖 PERFECT DAY CHECK
    // -------------------
    const TOTAL_DAILY_CHALLENGES = 4;
    const todayCompletions = stats.completedChallenges.filter(
      (c) => c.day === allowedDay,
    ).length;

    let perfectDayBonus = 0;
    let isPerfectDay = false;

    if (todayCompletions === TOTAL_DAILY_CHALLENGES) {
      isPerfectDay = true;
      perfectDayBonus = 5;
      stats.perfectDays += 1;
      stats.score += perfectDayBonus;
    }

    await stats.save();

    // -------------------
    // RESPONSE
    // -------------------
    res.json({
      successful: true,
      score: stats.score,
      pointsEarned: basePoints,
      streak: stats.streak,
      longestStreak: stats.longestStreak,
      streakBonus,
      perfectDay: isPerfectDay,
      perfectDayBonus,
      photoUrl,
    });
  } catch (err) {
    console.error("Complete challenge error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to complete challenge",
      error: err.message,
    });
  }
};
