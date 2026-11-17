const mongoose = require("mongoose");
require("./badge");

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    type: {
      type: String,
      enum: ["daily", "weekly", "speed", "accuracy"],
      default: "daily",
      index: true,
    },
    mode: {
      type: String,
      enum: ["time", "words", "quote", "custom", "zen", "random"],
      default: "words",
    },
    targetWpm: { type: Number, default: 0 },
    targetAccuracy: { type: Number, default: 0 },
    text: { type: String, required: true },
    duration: { type: Number, default: 60 },
    wordCount: { type: Number, default: 30 },
    xpReward: { type: Number, default: 100 },
    badgeReward: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" },
    startsAt: { type: Date, default: Date.now },
    endsAt: Date,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Challenge", challengeSchema);
