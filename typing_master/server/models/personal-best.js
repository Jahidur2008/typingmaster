const mongoose = require("mongoose");

const personalBestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["time", "words", "quote", "custom", "zen", "random"],
      required: true,
    },
    /** Test-type configuration, e.g. { timeSeconds: 30 } or { wordCount: 50 } */
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One personal best per user / mode / config combination.
personalBestSchema.index(
  { user: 1, mode: 1, "config.timeSeconds": 1, "config.wordCount": 1 },
  { name: "user_mode_config" },
);

module.exports = mongoose.model("PersonalBest", personalBestSchema);
