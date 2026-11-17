const express = require("express");
const { Course, Lesson, UserProgress, User } = require("../models");
const { auth, isConfigured } = require("../config/firebase");
const { requireAuth } = require("../middleware/auth");
const { checkMaintenance } = require("../middleware/maintenance");

const router = express.Router();

/**
 * Helper to optionally extract authenticated user from Authorization header.
 * Doesn't fail if no token is provided (allows guest access to course lists).
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ") || !isConfigured || !auth) {
    return next();
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) return next();

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
  } catch {
    // invalid token, continue as guest
  }
  next();
}

/**
 * GET /api/courses
 * Returns all published courses with their ordered lessons.
 * If user is authenticated, annotates each lesson with completion & unlock status.
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const courses = await Course.find({ published: true }).sort({ order: 1 }).lean();
    const courseIds = courses.map((c) => c._id);

    const lessons = await Lesson.find({ course: { $in: courseIds } })
      .sort({ course: 1, order: 1 })
      .lean();

    let userProgressMap = new Map();

    if (req.user) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user) {
        const progressList = await UserProgress.find({ user: user._id }).lean();
        progressList.forEach((p) => {
          userProgressMap.set(String(p.lesson), p);
        });
      }
    }

    // Structure lessons by course and compute sequential unlocking
    let previousLessonCompleted = true; // First lesson is always unlocked

    const coursesWithLessons = courses.map((course) => {
      const courseLessons = lessons
        .filter((l) => String(l.course) === String(course._id))
        .map((lesson) => {
          const userProg = userProgressMap.get(String(lesson._id));
          const completed = Boolean(userProg?.completed);
          const unlocked = previousLessonCompleted;

          // For the next lesson to unlock, this one must be completed
          previousLessonCompleted = completed;

          return {
            ...lesson,
            unlocked,
            completed,
            userWpm: userProg?.wpm || 0,
            userAccuracy: userProg?.accuracy || 0,
            attempts: userProg?.attempts || 0,
          };
        });

      return {
        ...course,
        lessons: courseLessons,
      };
    });

    return res.json({ courses: coursesWithLessons });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/courses/:slug
 * Retrieves single course details and lessons.
 */
router.get("/:slug", optionalAuth, async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, published: true }).lean();
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 }).lean();
    return res.json({ course: { ...course, lessons } });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/lessons/:id
 * Fetches a single lesson by ID with instructions and targets.
 */
router.get("/lesson/:id", optionalAuth, async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate("course").lean();
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    let progress = null;
    if (req.user) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user) {
        progress = await UserProgress.findOne({ user: user._id, lesson: lesson._id }).lean();
      }
    }

    return res.json({ lesson, progress });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/lessons/:id/complete
 * Records a lesson attempt.
 * If accuracy >= targetAccuracy (default 90) AND wpm >= targetWpm,
 * marks lesson completed, unlocks the next lesson, and awards XP.
 */
router.post("/lesson/:id/complete", requireAuth, checkMaintenance, async (req, res, next) => {
  try {
    const { uid, email } = req.user;
    let user = await User.findOne({ firebaseUid: uid });
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.firebaseUid = uid;
        await user.save();
      }
    }
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email ? email.toLowerCase() : undefined,
        name: req.user.name || "Typist",
        level: 1,
        xp: 0,
      });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const wpm = Math.max(0, Number(req.body.wpm) || 0);
    const accuracy = Math.max(0, Math.min(100, Number(req.body.accuracy) || 0));

    const targetWpm = lesson.targetWpm || 15;
    const targetAccuracy = lesson.targetAccuracy || 90;

    const passed = accuracy >= targetAccuracy && wpm >= targetWpm;

    let progress = await UserProgress.findOne({ user: user._id, lesson: lesson._id });

    if (!progress) {
      progress = new UserProgress({
        user: user._id,
        lesson: lesson._id,
        course: lesson.course,
        completed: passed,
        wpm,
        accuracy,
        attempts: 1,
        completedAt: passed ? new Date() : undefined,
      });
    } else {
      progress.attempts = (progress.attempts || 0) + 1;
      if (passed) {
        progress.completed = true;
        progress.completedAt = new Date();
      }
      // Keep best stats
      if (wpm > progress.wpm) progress.wpm = wpm;
      if (accuracy > progress.accuracy) progress.accuracy = accuracy;
    }

    await progress.save();

    let xpEarned = 0;
    if (passed) {
      // Award base lesson XP (50) + speed bonus
      xpEarned = 50 + Math.round(wpm * 0.5);
      if (accuracy === 100) xpEarned += 20;

      user.xp = (user.xp || 0) + xpEarned;
      user.level = Math.max(1, Math.floor(Math.sqrt(user.xp / 50)) + 1);
      await user.save();
    }

    // Find next lesson
    let nextLesson = await Lesson.findOne({
      course: lesson.course,
      order: { $gt: lesson.order },
    }).sort({ order: 1 });

    if (!nextLesson) {
      // Find first lesson of next course
      const currentCourse = await Course.findById(lesson.course);
      if (currentCourse) {
        const nextCourse = await Course.findOne({
          order: { $gt: currentCourse.order },
          published: true,
        }).sort({ order: 1 });
        if (nextCourse) {
          nextLesson = await Lesson.findOne({ course: nextCourse._id }).sort({ order: 1 });
        }
      }
    }

    return res.json({
      success: true,
      passed,
      targetWpm,
      targetAccuracy,
      achievedWpm: wpm,
      achievedAccuracy: accuracy,
      progress,
      xpEarned,
      nextLessonId: nextLesson ? nextLesson._id : null,
      user: {
        xp: user.xp,
        level: user.level,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
