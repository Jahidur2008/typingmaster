const mongoose = require("mongoose");

const MODES = ["time", "words", "quote", "custom", "zen", "random"];
const LANGUAGES = ["english", "bangla"];

const wpmSampleSchema = new mongoose.Schema(
  {
    second: { type: Number, required: true, min: 1 },
    wpm: Number,
    rawWpm: Number,
    errors: Number,
  },
  { _id: false, suppressReservedKeysWarning: true },
);

const testResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    mode: { type: String, enum: MODES, required: true },
    /** Time mode: duration in seconds. */
    duration: { type: Number, min: 1 },
    /** Word/quote/custom modes: number of words. */
    wordCount: { type: Number, min: 1 },
    language: { type: String, enum: LANGUAGES, default: "english" },
    wpm: { type: Number, required: true },
    rawWpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 },
    chars: {
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 },
      extra: { type: Number, default: 0 },
      missed: { type: Number, default: 0 },
    },
    /** Per-second series for the results graph. */
    wpmPerSecond: { type: [wpmSampleSchema], default: [] },
  },
  { timestamps: true }, // createdAt / updatedAt
);

testResultSchema.index({ createdAt: -1 });
testResultSchema.index({ mode: 1, duration: 1, language: 1, wpm: -1, createdAt: -1 });
testResultSchema.index({ mode: 1, wordCount: 1, language: 1, wpm: -1, createdAt: -1 });
testResultSchema.index({ user: 1, wpm: -1 });
testResultSchema.index({ createdAt: -1, wpm: -1 });

module.exports = mongoose.model("TestResult", testResultSchema);
