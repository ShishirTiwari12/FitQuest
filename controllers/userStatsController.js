const UserStats = require("../models/UserStats");

exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching stats for user ${userId}`);

    let stats = await UserStats.findOne({ user: userId });

    if (!stats) {
      console.log(`No stats found, creating new UserStats for user ${userId}`);
      stats = new UserStats({
        user: userId,
        score: 0,
        challengesCompleted: 0,
        photoUploads: 0,
        completedChallenges: [],
        streak: 0,
        longestStreak: 0,
        perfectDays: 0,
        lastActiveDate: null, // ensures streak can start correctly
      });
      await stats.save();
    }

    console.log(
      `User stats - Score: ${stats.score}, Challenges: ${stats.challengesCompleted}, Streak: ${stats.streak}, Last Active: ${stats.lastActiveDate}`,
    );

    res.json({
      successful: true,
      score: stats.score,
      completedChallenges: stats.completedChallenges,
      challengesCompleted: stats.challengesCompleted,
      photoUploads: stats.photoUploads,
      streak: stats.streak,
      longestStreak: stats.longestStreak,
      perfectDays: stats.perfectDays,
      lastActiveDate: stats.lastActiveDate, // NEW: frontend can see last active date
    });
  } catch (err) {
    console.error("Fetch stats error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to fetch user stats",
      error: err.message,
    });
  }
};

exports.addScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body;

    const SCORE_RULES = {
      CHALLENGE_COMPLETE: 5,
      PHOTO_UPLOAD: 10,
    };

    if (!SCORE_RULES[action]) {
      return res.status(400).json({
        successful: false,
        message: "Invalid score action",
      });
    }

    const points = SCORE_RULES[action];

    let stats = await UserStats.findOne({ user: userId });

    if (!stats) {
      stats = new UserStats({
        user: userId,
        score: points,
        challengesCompleted: action === "CHALLENGE_COMPLETE" ? 1 : 0,
        photoUploads: action === "PHOTO_UPLOAD" ? 1 : 0,
        completedChallenges: [],
        streak: 0,
        lastActiveDate: new Date(),
      });
    } else {
      stats.score = (stats.score || 0) + points;
      if (action === "CHALLENGE_COMPLETE") stats.challengesCompleted += 1;
      if (action === "PHOTO_UPLOAD") stats.photoUploads += 1;
      stats.lastActiveDate = new Date();
    }

    await stats.save();

    res.json({
      successful: true,
      score: stats.score,
    });
  } catch (err) {
    console.error("Score update error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to update score",
      error: err.message,
    });
  }
};
