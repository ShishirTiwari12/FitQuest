const mongoose = require("mongoose");

const photoReportSchema = new mongoose.Schema(
  {
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challengeId: {
      type: String,
      required: true,
    },
    day: {
      type: Number,
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      default: "Fake or unrelated image",
    },
  },
  { timestamps: true },
);

// Prevent duplicate report by same user on same photo
photoReportSchema.index(
  { reportedUser: 1, challengeId: 1, day: 1, reportedBy: 1 },
  { unique: true },
);

// PhotoReportSchema.index({ reporter: 1, photoId: 1 }, { unique: true });

module.exports = mongoose.model("PhotoReport", photoReportSchema);
