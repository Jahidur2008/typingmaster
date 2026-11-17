const express = require("express");
const mongoose = require("mongoose");
const { requireAdmin } = require("../middleware/auth");
const User = require("../models/user");
const TestResult = require("../models/test-result");
const Word = require("../models/word");
const Quote = require("../models/quote");
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Challenge = require("../models/challenge");
const ChallengeAttempt = require("../models/challenge-attempt");
const Setting = require("../models/setting");

const {
  getAdminCredentials,
  generateAdminToken,
} = require("../services/admin-auth");

const router = express.Router();

/**
 * POST /api/admin/login
 * Validates admin credentials from admin.env and issues a signed admin session token.
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const creds = getAdminCredentials();

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username.trim() === creds.username && password.trim() === creds.password) {
    const token = generateAdminToken(creds.username);
    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        username: creds.username,
        role: "admin",
      },
    });
  }

  return res.status(401).json({ error: "Invalid admin username or password" });
});

// Protect ALL routes below with requireAdmin
router.use(requireAdmin);

/**
 * GET /api/admin/me
 * Verifies currently active admin token and returns admin profile
 */
router.get("/me", (req, res) => {
  return res.json({
    admin: req.user,
  });
});

/**
 * Helper to get or initialize site settings document
 */
async function getSiteSettings() {
  let setting = await Setting.findOne({ key: "site_config" });
  if (!setting) {
    setting = await Setting.create({ key: "site_config" });
  }
  return setting;
}

/* ========================================================================= */
/* 1. DASHBOARD OVERVIEW */
/* ========================================================================= */
router.get("/dashboard", async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTests = await TestResult.countDocuments();

    // Tests today (since UTC midnight)
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const testsToday = await TestResult.countDocuments({ createdAt: { $gte: startOfToday } });

    const activeChallenges = await Challenge.countDocuments({ active: true });
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();

    // Average WPM calculation
    const avgStats = await TestResult.aggregate([
      { $group: { _id: null, avgWpm: { $avg: "$wpm" }, avgAcc: { $avg: "$accuracy" } } },
    ]);
    const avgWpm = avgStats[0] ? Math.round(avgStats[0].avgWpm) : 0;
    const avgAccuracy = avgStats[0] ? Math.round(avgStats[0].avgAcc * 10) / 10 : 0;

    // Daily test counts for the past 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyTestsAgg = await TestResult.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          avgWpm: { $avg: "$wpm" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent 5 users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role country level xp isBanned createdAt photo")
      .lean();

    return res.json({
      metrics: {
        totalUsers,
        totalTests,
        testsToday,
        activeChallenges,
        totalCourses,
        totalLessons,
        avgWpm,
        avgAccuracy,
      },
      chartData: dailyTestsAgg.map((d) => ({
        date: d._id,
        count: d.count,
        avgWpm: Math.round(d.avgWpm || 0),
      })),
      recentUsers,
    });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 2. USER MANAGEMENT */
/* ========================================================================= */
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", role = "all", status = "all" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (search.trim()) {
      const reg = new RegExp(search.trim(), "i");
      filter.$or = [{ name: reg }, { email: reg }, { country: reg }];
    }
    if (role !== "all") {
      filter.role = role;
    }
    if (status === "banned") {
      filter.isBanned = true;
    } else if (status === "active") {
      filter.isBanned = { $ne: true };
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ message: `Role updated to ${role}`, user });
  } catch (err) {
    return next(err);
  }
});

router.patch("/users/:id/ban", async (req, res, next) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: Boolean(isBanned) },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      message: `User ${isBanned ? "banned" : "unbanned"} successfully`,
      user,
    });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 3. TEST MANAGEMENT */
/* ========================================================================= */
router.get("/tests", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, mode = "all", language = "all", search = "" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (mode !== "all") filter.mode = mode;
    if (language !== "all") filter.language = language;

    if (search.trim()) {
      // Find users matching search
      const matchedUsers = await User.find({
        $or: [{ name: new RegExp(search.trim(), "i") }, { email: new RegExp(search.trim(), "i") }],
      }).select("_id");
      filter.user = { $in: matchedUsers.map((u) => u._id) };
    }

    const total = await TestResult.countDocuments(filter);
    const results = await TestResult.find(filter)
      .populate("user", "name email photo country level")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.delete("/tests/:id", async (req, res, next) => {
  try {
    const test = await TestResult.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ error: "Test result not found" });
    return res.json({ message: "Test result deleted successfully" });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 4. WORD & QUOTE DATABASE */
/* ========================================================================= */
// Words List
router.get("/words", async (req, res, next) => {
  try {
    const { language = "all", difficulty = "all", search = "", page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const filter = {};
    if (language !== "all") filter.language = language;
    if (difficulty !== "all") filter.difficulty = difficulty;
    if (search.trim()) filter.text = new RegExp(search.trim(), "i");

    const total = await Word.countDocuments(filter);
    const words = await Word.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      words,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
});

// Add Single Word
router.post("/words", async (req, res, next) => {
  try {
    const { language, text, difficulty = "medium" } = req.body;
    if (!language || !text) {
      return res.status(400).json({ error: "Language and text are required" });
    }

    const word = await Word.create({
      language: language.toLowerCase(),
      text: text.trim().toLowerCase(),
      difficulty,
    });
    return res.status(201).json({ message: "Word added", word });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Word already exists for this language" });
    }
    return next(err);
  }
});

// Bulk Import Words
router.post("/words/bulk", async (req, res, next) => {
  try {
    const { language, words, difficulty = "medium" } = req.body;
    if (!language || !words) {
      return res.status(400).json({ error: "Language and words are required" });
    }

    let wordList = [];
    if (Array.isArray(words)) {
      wordList = words;
    } else if (typeof words === "string") {
      wordList = words
        .split(/[\n,]+/)
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean);
    }

    const uniqueWords = Array.from(new Set(wordList));
    const lang = language.toLowerCase();

    let inserted = 0;
    for (const w of uniqueWords) {
      try {
        await Word.updateOne(
          { language: lang, text: w },
          { $setOnInsert: { language: lang, text: w, difficulty } },
          { upsert: true },
        );
        inserted++;
      } catch {
        // Continue on individual duplicate
      }
    }

    return res.json({ message: `Successfully imported ${inserted} words for ${lang}` });
  } catch (err) {
    return next(err);
  }
});

router.put("/words/:id", async (req, res, next) => {
  try {
    const { text, difficulty, language } = req.body;
    const word = await Word.findByIdAndUpdate(
      req.params.id,
      { text: text ? text.trim().toLowerCase() : undefined, difficulty, language },
      { new: true },
    );
    if (!word) return res.status(404).json({ error: "Word not found" });
    return res.json({ message: "Word updated", word });
  } catch (err) {
    return next(err);
  }
});

router.delete("/words/:id", async (req, res, next) => {
  try {
    const word = await Word.findByIdAndDelete(req.params.id);
    if (!word) return res.status(404).json({ error: "Word not found" });
    return res.json({ message: "Word deleted" });
  } catch (err) {
    return next(err);
  }
});

// Quotes List
router.get("/quotes", async (req, res, next) => {
  try {
    const { language = "all", length = "all", search = "", page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};
    if (language !== "all") filter.language = language;
    if (length !== "all") filter.length = length;
    if (search.trim()) {
      filter.$or = [{ text: new RegExp(search.trim(), "i") }, { source: new RegExp(search.trim(), "i") }];
    }

    const total = await Quote.countDocuments(filter);
    const quotes = await Quote.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      quotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/quotes", async (req, res, next) => {
  try {
    const { language, text, source = "", length = "medium" } = req.body;
    if (!language || !text) {
      return res.status(400).json({ error: "Language and text are required" });
    }

    const quote = await Quote.create({ language, text, source, length });
    return res.status(201).json({ message: "Quote added", quote });
  } catch (err) {
    return next(err);
  }
});

router.put("/quotes/:id", async (req, res, next) => {
  try {
    const { language, text, source, length } = req.body;
    const quote = await Quote.findByIdAndUpdate(req.params.id, { language, text, source, length }, { new: true });
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    return res.json({ message: "Quote updated", quote });
  } catch (err) {
    return next(err);
  }
});

router.delete("/quotes/:id", async (req, res, next) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    return res.json({ message: "Quote deleted" });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 5. COURSE & LESSON MANAGEMENT */
/* ========================================================================= */
router.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ order: 1, createdAt: 1 }).lean();
    const coursesWithCount = await Promise.all(
      courses.map(async (c) => {
        const lessonCount = await Lesson.countDocuments({ course: c._id });
        return { ...c, lessonCount };
      }),
    );
    return res.json({ courses: coursesWithCount });
  } catch (err) {
    return next(err);
  }
});

router.post("/courses", async (req, res, next) => {
  try {
    const { title, slug, description, language = "english", difficulty = "beginner", order = 0, published = true } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ error: "Title and slug are required" });
    }

    const course = await Course.create({
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description,
      language,
      difficulty,
      order: Number(order) || 0,
      published: Boolean(published),
    });
    return res.status(201).json({ message: "Course created", course });
  } catch (err) {
    return next(err);
  }
});

router.put("/courses/:id", async (req, res, next) => {
  try {
    const { title, slug, description, language, difficulty, order, published } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        title,
        slug: slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") : undefined,
        description,
        language,
        difficulty,
        order: Number(order),
        published: Boolean(published),
      },
      { new: true },
    );
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.json({ message: "Course updated", course });
  } catch (err) {
    return next(err);
  }
});

router.delete("/courses/:id", async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    await Lesson.deleteMany({ course: course._id });
    return res.json({ message: "Course and associated lessons deleted" });
  } catch (err) {
    return next(err);
  }
});

// Lessons
router.get("/courses/:courseId/lessons", async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({ order: 1, createdAt: 1 }).lean();
    return res.json({ lessons });
  } catch (err) {
    return next(err);
  }
});

router.post("/courses/:courseId/lessons", async (req, res, next) => {
  try {
    const {
      title,
      description = "",
      instructions = "",
      content,
      type = "lesson",
      targetWpm = 15,
      targetAccuracy = 90,
      order = 0,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const lesson = await Lesson.create({
      course: req.params.courseId,
      title,
      description,
      instructions,
      content,
      type,
      targetWpm: Number(targetWpm) || 15,
      targetAccuracy: Number(targetAccuracy) || 90,
      order: Number(order) || 0,
    });

    return res.status(201).json({ message: "Lesson created", lesson });
  } catch (err) {
    return next(err);
  }
});

router.put("/lessons/:id", async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    return res.json({ message: "Lesson updated", lesson });
  } catch (err) {
    return next(err);
  }
});

router.delete("/lessons/:id", async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    return res.json({ message: "Lesson deleted" });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 6. LANGUAGE & LAYOUT MANAGEMENT */
/* ========================================================================= */
router.get("/languages", async (req, res, next) => {
  try {
    const setting = await getSiteSettings();
    return res.json({
      languages: setting.languages || [],
      layouts: setting.layouts || [],
    });
  } catch (err) {
    return next(err);
  }
});

router.put("/languages", async (req, res, next) => {
  try {
    const { languages, layouts } = req.body;
    const setting = await getSiteSettings();

    if (Array.isArray(languages)) setting.languages = languages;
    if (Array.isArray(layouts)) setting.layouts = layouts;

    await setting.save();
    return res.json({ message: "Languages and layouts updated successfully", setting });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 7. CHALLENGE MANAGEMENT */
/* ========================================================================= */
router.get("/challenges", async (req, res, next) => {
  try {
    const challenges = await Challenge.find().sort({ createdAt: -1 }).lean();
    const withStats = await Promise.all(
      challenges.map(async (c) => {
        const attemptCount = await ChallengeAttempt.countDocuments({ challenge: c._id });
        return { ...c, attemptCount };
      }),
    );
    return res.json({ challenges: withStats });
  } catch (err) {
    return next(err);
  }
});

router.post("/challenges", async (req, res, next) => {
  try {
    const {
      title,
      description,
      type = "daily",
      mode = "words",
      text,
      duration = 60,
      wordCount = 30,
      targetWpm = 0,
      targetAccuracy = 0,
      xpReward = 100,
      startsAt,
      endsAt,
      active = true,
    } = req.body;

    if (!title || !text) {
      return res.status(400).json({ error: "Title and text are required" });
    }

    const challenge = await Challenge.create({
      title,
      description,
      type,
      mode,
      text,
      duration: Number(duration) || 60,
      wordCount: Number(wordCount) || 30,
      targetWpm: Number(targetWpm) || 0,
      targetAccuracy: Number(targetAccuracy) || 0,
      xpReward: Number(xpReward) || 100,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : undefined,
      active: Boolean(active),
    });

    return res.status(201).json({ message: "Challenge created", challenge });
  } catch (err) {
    return next(err);
  }
});

router.put("/challenges/:id", async (req, res, next) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    return res.json({ message: "Challenge updated", challenge });
  } catch (err) {
    return next(err);
  }
});

router.delete("/challenges/:id", async (req, res, next) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });
    return res.json({ message: "Challenge deleted" });
  } catch (err) {
    return next(err);
  }
});

/* ========================================================================= */
/* 8. WEBSITE SETTINGS */
/* ========================================================================= */
router.get("/settings", async (req, res, next) => {
  try {
    const setting = await getSiteSettings();
    return res.json({ setting });
  } catch (err) {
    return next(err);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const { siteName, logoUrl, defaultTheme, maintenanceMode } = req.body;
    const setting = await getSiteSettings();

    if (siteName !== undefined) setting.siteName = siteName;
    if (logoUrl !== undefined) setting.logoUrl = logoUrl;
    if (defaultTheme !== undefined) setting.defaultTheme = defaultTheme;
    if (maintenanceMode !== undefined) setting.maintenanceMode = Boolean(maintenanceMode);

    await setting.save();
    return res.json({ message: "Site settings updated successfully", setting });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
