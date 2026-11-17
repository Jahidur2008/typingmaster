const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ["english", "bangla"],
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true },
);

// The same word can exist in both languages.
wordSchema.index({ language: 1, text: 1 }, { unique: true });

module.exports = mongoose.model("Word", wordSchema);
