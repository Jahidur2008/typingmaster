const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      enum: ["english", "bangla"],
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    source: String,
    length: {
      type: String,
      enum: ["short", "medium", "long"],
      default: "medium",
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quote", quoteSchema);
