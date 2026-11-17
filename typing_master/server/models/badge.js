const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    icon: String,
    /** Award criteria, e.g. { type: "wpm", value: 100 } */
    criteria: { type: mongoose.Schema.Types.Mixed, default: {} },
    xpReward: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Badge", badgeSchema);
