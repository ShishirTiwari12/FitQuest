const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserStats = require("./UserStats");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["active", "under_review", "leaderboard_banned"],
      default: "active",
    },
    moderationNotes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

//using prehook to hash password before saving it
userSchema.pre("save", async function (next) {
  const saltRounds = 10;
  if (!this.isModified("password")) return next();
  try {
    const hash = await bcrypt.hash(this.password, saltRounds);
    this.password = hash;
    next();
  } catch (err) {
    console.log("error while hashing password " + err.message);
    next(err);
  }
});

userSchema.post("save", async function (doc, next) {
  try {
    // Create stats only if they don't exist
    const existingStats = await UserStats.findOne({ user: doc._id });

    if (!existingStats) {
      await UserStats.create({
        user: doc._id,
        score: 0,
        challengesCompleted: 0,
        photoUploads: 0,
        streak: 0,
        lastActiveDate: null,
      });
    }

    next();
  } catch (err) {
    console.error("Error creating UserStats:", err);
    next(err);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
