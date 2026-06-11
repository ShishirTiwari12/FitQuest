const mongoose = require("mongoose");

const completedChallengeSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
    },
    challengeId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["photo", "normal"],
      required: true,
    },
    photoUrl: {
      type: String,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true, // ⚡ helps with daily queries
    },
  },
  { _id: false },
);

const userStatsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // 🔢 SCORE (Leaderboard source of truth)
    score: {
      type: Number,
      default: 0,
      index: true,
    },

    // 🧩 DETAILED COMPLETION TRACKING
    completedChallenges: {
      type: [completedChallengeSchema],
      default: [],
    },

    // 📊 SUMMARY COUNTERS
    challengesCompleted: {
      type: Number,
      default: 0,
    },

    photoUploads: {
      type: Number,
      default: 0,
    },

    // 🔥 STREAK SYSTEM
    streak: {
      type: Number,
      default: 0,
      index: true, // useful for leaderboard sorting later
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    lastActiveDate: {
      type: Date,
      index: true,
    },

    // 🎖 PERFECT DAY SYSTEM
    perfectDays: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserStats", userStatsSchema);
