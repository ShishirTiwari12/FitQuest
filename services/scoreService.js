const UserStats = require("../models/UserStats");

/**
 * Add score to a user safely
 * @param {ObjectId} userId
 * @param {number} points
 * @param {Object} options
 */
async function addScore(userId, points, options = {}) {
  const {
    challengeType = "normal", // normal | photo
    incrementChallenge = false,
    incrementPhoto = false,
  } = options;

  const update = {
    $inc: {
      score: points,
    },
    $set: {
      lastActiveDate: new Date(),
    },
  };

  if (incrementChallenge) {
    update.$inc.challengesCompleted = 1;
  }

  if (incrementPhoto) {
    update.$inc.photoUploads = 1;
  }

  return UserStats.findOneAndUpdate({ user: userId }, update, { new: true });
}

module.exports = {
  addScore,
};
