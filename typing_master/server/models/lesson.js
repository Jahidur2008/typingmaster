const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    /** Instructions explaining finger placement, posture, and technique */
    instructions: { type: String, trim: true },
    /** The target drill or lesson text */
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["lesson", "drill", "test"],
      default: "lesson",
    },
    targetWpm: { type: Number, default: 15, min: 0 },
    targetAccuracy: { type: Number, default: 90, min: 0, max: 100 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model("Lesson", lessonSchema);
