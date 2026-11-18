const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { checkMaintenance } = require("../middleware/maintenance");
const User = require("../models/user");
const TestResult = require("../models/test-result");
const PersonalBest = require("../models/personal-best");
const {
  calculateLevel,
  calculateTestXp,
  updateStreak,
  checkAndAwardBadges,
} = require("../services/gamification");

const router = express.Router();

/**
 * POST /api/results
 * Saves a completed test result for the authenticated user,
 * automatically updates PersonalBest if beaten, and awards XP.
 */
router.post("/", requireAuth, checkMaintenance, async (req, res, next) => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const body = req.body || {};

    // 1. Locate or create user in MongoDB
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
        name: tokenName || (email ? email.split("@")[0] : "Typist"),
        photo: picture || "",
        country: "",
        role: "user",
        level: 1,
        xp: 0,
        badges: [],
      });
    }

    const {
      mode = "time",
      duration,
      wordCount,
      language = "english",
      wpm,
      rawWpm = 0,
      accuracy = 0,
      consistency = 0,
      chars = {},
      wpmPerSecond = [],
      quoteLength,
    } = body;

    if (wpm === undefined || isNaN(Number(wpm))) {
      return res.status(400).json({ error: "Missing or invalid wpm in test result" });
    }

    // 2. Save TestResult
    const testResult = new TestResult({
      user: user._id,
      mode,
      duration: duration ? Number(duration) : undefined,
      wordCount: wordCount ? Number(wordCount) : undefined,
      language,
      wpm: Math.round(Number(wpm) * 10) / 10,
      rawWpm: Math.round(Number(rawWpm) * 10) / 10,
      accuracy: Math.round(Number(accuracy) * 10) / 10,
      consistency: Math.round(Number(consistency) * 10) / 10,
      chars: {
        correct: Number(chars.correct) || 0,
        incorrect: Number(chars.incorrect) || 0,
        extra: Number(chars.extra) || 0,
        missed: Number(chars.missed) || 0,
      },
      wpmPerSecond: Array.isArray(wpmPerSecond)
        ? wpmPerSecond.map((s) => ({
            second: Number(s.second) || 1,
            wpm: Number(s.wpm) || 0,
            rawWpm: Number(s.rawWpm) || 0,
            errors: Number(s.errors) || 0,
          }))
        : [],
      keyErrors: body.keyErrors && typeof body.keyErrors === "object" ? body.keyErrors : {},
    });

    await testResult.save();

    // 3. Check and update PersonalBest
    let isNewPB = false;
    let pbConfig = {};
    const pbQuery = { user: user._id, mode };

    if (mode === "time") {
      const timeSec = Number(duration) || 30;
      pbConfig = { timeSeconds: timeSec };
      pbQuery["config.timeSeconds"] = timeSec;
    } else if (mode === "words") {
      const words = Number(wordCount) || 25;
      pbConfig = { wordCount: words };
      pbQuery["config.wordCount"] = words;
    } else if (mode === "quote") {
      pbConfig = { quoteLength: quoteLength || "medium" };
      pbQuery["config.quoteLength"] = quoteLength || "medium";
    }

    const existingPB = await PersonalBest.findOne(pbQuery);

    if (!existingPB) {
      await PersonalBest.create({
        user: user._id,
        mode,
        config: pbConfig,
        wpm: testResult.wpm,
        accuracy: testResult.accuracy,
        date: new Date(),
      });
      isNewPB = true;
    } else if (testResult.wpm > existingPB.wpm) {
      existingPB.wpm = testResult.wpm;
      existingPB.accuracy = testResult.accuracy;
      existingPB.date = new Date();
      await existingPB.save();
      isNewPB = true;
    }

    // 4. Update user streak
    updateStreak(user, new Date());

    // 5. Award test XP
    const xpEarned = calculateTestXp(testResult.wpm, testResult.accuracy);
    const oldLevel = user.level || 1;
    user.xp = (user.xp || 0) + xpEarned;

    // 6. Check and award new badges
    const newBadges = await checkAndAwardBadges(user, { testResult });

    const newLevel = calculateLevel(user.xp);
    const leveledUp = newLevel > oldLevel;
    user.level = newLevel;

    await user.save();

    return res.status(201).json({
      message: "Result saved successfully",
      result: testResult,
      newPB: isNewPB,
      xpEarned,
      newBadges,
      user: {
        xp: user.xp,
        level: user.level,
        leveledUp,
        streak: user.streak,
        badges: user.badges,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/results/personal-bests
 * Retrieves all personal best records grouped by mode, subMode, and language.
 */
router.get("/personal-bests", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.json({ time: [], words: [], quote: [] });
    }

    const { language } = req.query;
    const matchUser = { user: user._id };
    if (language && language !== "all") {
      matchUser.language = language;
    }

    // Time mode targets: 15, 30, 60, 120 seconds
    const timeDurations = [15, 30, 60, 120];
    const timePBs = await Promise.all(
      timeDurations.map(async (duration) => {
        const query = { ...matchUser, mode: "time", duration };
        const topResult = await TestResult.findOne(query).sort({ wpm: -1, createdAt: -1 }).lean();
        return {
          duration,
          label: `${duration}s`,
          wpm: topResult ? topResult.wpm : null,
          accuracy: topResult ? topResult.accuracy : null,
          language: topResult ? topResult.language : (language || "english"),
          date: topResult ? topResult.createdAt : null,
        };
      })
    );

    // Words mode targets: 10, 25, 50, 100 words
    const wordCounts = [10, 25, 50, 100];
    const wordsPBs = await Promise.all(
      wordCounts.map(async (wordCount) => {
        const query = { ...matchUser, mode: "words", wordCount };
        const topResult = await TestResult.findOne(query).sort({ wpm: -1, createdAt: -1 }).lean();
        return {
          wordCount,
          label: `${wordCount} words`,
          wpm: topResult ? topResult.wpm : null,
          accuracy: topResult ? topResult.accuracy : null,
          language: topResult ? topResult.language : (language || "english"),
          date: topResult ? topResult.createdAt : null,
        };
      })
    );

    // Quote mode targets: short, medium, long
    const quoteLengths = ["short", "medium", "long"];
    const quotePBs = await Promise.all(
      quoteLengths.map(async (quoteLength) => {
        const query = { ...matchUser, mode: "quote" };
        let topResult;
        if (quoteLength === "short") {
          topResult = await TestResult.findOne({ ...query, wordCount: { $lt: 25 } }).sort({ wpm: -1, createdAt: -1 }).lean();
        } else if (quoteLength === "medium") {
          topResult = await TestResult.findOne({ ...query, wordCount: { $gte: 25, $lte: 60 } }).sort({ wpm: -1, createdAt: -1 }).lean();
        } else {
          topResult = await TestResult.findOne({ ...query, wordCount: { $gt: 60 } }).sort({ wpm: -1, createdAt: -1 }).lean();
        }
        return {
          quoteLength,
          label: quoteLength.charAt(0).toUpperCase() + quoteLength.slice(1),
          wpm: topResult ? topResult.wpm : null,
          accuracy: topResult ? topResult.accuracy : null,
          language: topResult ? topResult.language : (language || "english"),
          date: topResult ? topResult.createdAt : null,
        };
      })
    );

    return res.json({
      time: timePBs,
      words: wordsPBs,
      quote: quotePBs,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/results
 * Retrieves paginated test results for the authenticated user,
 * with optional filters for mode, language, and date range.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.json({
        results: [],
        pagination: { page: 1, limit: 15, total: 0, totalPages: 0 },
      });
    }

    const {
      page = 1,
      limit = 15,
      mode,
      language,
      startDate,
      endDate,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

    const filter = { user: user._id };

    if (mode && mode !== "all") {
      filter.mode = mode;
    }

    if (language && language !== "all") {
      filter.language = language;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Set to end of day if only date is passed
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const allowedSortFields = ["createdAt", "wpm", "rawWpm", "accuracy", "consistency"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const total = await TestResult.countDocuments(filter);
    const results = await TestResult.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
