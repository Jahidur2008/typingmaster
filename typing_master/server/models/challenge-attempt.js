const mongoose = require("mongoose");

const challengeAttemptSchema = new mongoose.Schema(
  {
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, default: 0 },
    timeSeconds: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    earnedXp: { type: Number, default: 0 },
    /** Whether the user finished the full challenge. */
    finished: { type: Boolean, default: true },
  },
  { timestamps: true }, // createdAt / updatedAt
);

challengeAttemptSchema.index({ challenge: 1, wpm: -1 }); // leaderboard queries
challengeAttemptSchema.index({ challenge: 1, user: 1 });

module.exports = mongoose.model("ChallengeAttempt", challengeAttemptSchema);
