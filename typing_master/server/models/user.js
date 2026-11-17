const mongoose = require("mongoose");
// Ensure Badge model is registered for populate("badges")
require("./badge");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, index: true, unique: true, sparse: true },
    name: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true,
    },
    photo: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBanned: { type: Boolean, default: false },
    country: String,
    level: { type: Number, default: 1, min: 1 },
    xp: { type: Number, default: 0, min: 0 },
    streak: {
      current: { type: Number, default: 0 },
      best: { type: Number, default: 0 },
      lastActiveDate: { type: String, default: "" },
    },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Badge" }],
  },
  { timestamps: true }, // createdAt / updatedAt
);

module.exports = mongoose.model("User", userSchema);
