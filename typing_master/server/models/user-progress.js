const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
    completed: { type: Boolean, default: false },
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    attempts: { type: Number, default: 1 },
    completedAt: Date,
  },
  { timestamps: true },
);

userProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model("UserProgress", userProgressSchema);
