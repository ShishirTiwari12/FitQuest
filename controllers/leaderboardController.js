const UserStats = require("../models/UserStats");
const User = require("../models/User");

// GET top leaderboard
exports.getTopLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    console.log(`\n🔍 Fetching leaderboard (limit: ${limit})...`);

    // First check total count
    const totalCount = await UserStats.countDocuments();
    console.log(`📊 Total UserStats in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log(`⚠️  No UserStats found in database!`);
      return res.json({
        successful: true,
        data: [],
      });
    }

    // Fetch users
    const topUsers = await UserStats.find()
      .populate({
        path: "user",
        select: "username accountStatus",
      })
      .sort({ score: -1 })
      .limit(limit * 2);

    // filter out users with accountStatus !== "active" or "leaderboard_banned" if needed
    const validUsers = topUsers.filter(
      (entry) => entry.user && entry.user.accountStatus === "active",
    );

    // Take only requested limit
    const limitedUsers = validUsers.slice(0, limit);

    const formatted = limitedUsers.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user._id,
      username: entry.user.username,
      score: entry.score,
      challengesCompleted: entry.challengesCompleted || 0,
    }));

    console.log(`📤 Returning ${formatted.length} users in leaderboard\n`);

    res.json({
      successful: true,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Leaderboard error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to fetch leaderboard",
      error: err.message,
    });
  }
};

// GET my rank
exports.getMyRank = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`\n🔍 Fetching rank for user ${userId}...`);

    const allUsers = await UserStats.find()
      .populate({
        path: "user",
        select: "username accountStatus",
      })
      .sort({ score: -1 });

    const validUsers = allUsers.filter(
      (entry) => entry.user && entry.user.accountStatus === "active",
    );

    const userIndex = validUsers.findIndex(
      (entry) => entry.user._id.toString() === userId,
    );

    console.log(`📍 User index: ${userIndex}`);

    if (userIndex === -1) {
      console.log(`⚠️  User not found in leaderboard\n`);
      return res.json({
        successful: true,
        rank: null,
        totalUsers: validUsers.length,
      });
    }

    console.log(`✅ User rank: ${userIndex + 1} / ${validUsers.length}\n`);

    res.json({
      successful: true,
      rank: userIndex + 1,
      totalUsers: validUsers.length,
    });
  } catch (err) {
    console.error("❌ My rank error:", err);
    res.status(500).json({
      successful: false,
      message: "Failed to fetch rank",
      error: err.message,
    });
  }
};
