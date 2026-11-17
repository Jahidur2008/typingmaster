const express = require("express");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { checkMaintenance } = require("../middleware/maintenance");
const Challenge = require("../models/challenge");
const ChallengeAttempt = require("../models/challenge-attempt");
const User = require("../models/user");
const Badge = require("../models/badge");
const {
  calculateLevel,
  updateStreak,
  checkAndAwardBadges,
} = require("../services/gamification");

const router = express.Router();

/**
 * GET /api/challenges
 * Lists all active challenges with user attempt/completion status.
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const challenges = await Challenge.find({ active: true })
      .populate("badgeReward")
      .sort({ type: 1 });

    let userAttemptsMap = {};
    if (req.user) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user) {
        const attempts = await ChallengeAttempt.find({ user: user._id });
        for (const att of attempts) {
          const cId = att.challenge.toString();
          if (!userAttemptsMap[cId]) {
            userAttemptsMap[cId] = {
              completed: false,
              attemptsCount: 0,
              bestWpm: 0,
              bestAccuracy: 0,
            };
          }
          userAttemptsMap[cId].attemptsCount++;
          if (att.passed) userAttemptsMap[cId].completed = true;
          userAttemptsMap[cId].bestWpm = Math.max(
            userAttemptsMap[cId].bestWpm,
            att.wpm,
          );
          userAttemptsMap[cId].bestAccuracy = Math.max(
            userAttemptsMap[cId].bestAccuracy,
            att.accuracy,
          );
        }
      }
    }

    const result = challenges.map((c) => {
      const uStats = userAttemptsMap[c._id.toString()] || {
        completed: false,
        attemptsCount: 0,
        bestWpm: 0,
        bestAccuracy: 0,
      };

      return {
        _id: c._id,
        title: c.title,
        description: c.description,
        type: c.type,
        mode: c.mode,
        text: c.text,
        targetWpm: c.targetWpm,
        targetAccuracy: c.targetAccuracy,
        duration: c.duration,
        wordCount: c.wordCount,
        xpReward: c.xpReward,
        badgeReward: c.badgeReward,
        endsAt: c.endsAt,
        startsAt: c.startsAt,
        completed: uStats.completed,
        attemptsCount: uStats.attemptsCount,
        userBestWpm: uStats.bestWpm,
        userBestAccuracy: uStats.bestAccuracy,
      };
    });

    return res.json({ challenges: result });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/challenges/badges
 * Lists all badges with user unlock status.
 */
router.get("/badges", optionalAuth, async (req, res, next) => {
  try {
    const badges = await Badge.find().sort({ xpReward: 1 });
    let userBadgeIds = new Set();

    if (req.user) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user && user.badges) {
        userBadgeIds = new Set(user.badges.map((b) => b.toString()));
      }
    }

    const result = badges.map((b) => ({
      _id: b._id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      icon: b.icon,
      xpReward: b.xpReward,
      unlocked: userBadgeIds.has(b._id.toString()),
    }));

    return res.json({ badges: result });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/challenges/:id
 * Get details and leaderboard for a specific challenge.
 */
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate("badgeReward");
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    // Top 10 leaderboard for this challenge
    const leaderboard = await ChallengeAttempt.find({
      challenge: challenge._id,
      passed: true,
    })
      .sort({ wpm: -1, accuracy: -1 })
      .limit(10)
      .populate("user", "name photo country");

    return res.json({ challenge, leaderboard });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/challenges/:id/attempt
 * Submits an attempt for a challenge, checks passing criteria, awards XP and badges.
 */
router.post("/:id/attempt", requireAuth, checkMaintenance, async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate("badgeReward");
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const { uid, email, name, picture } = req.user;
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email ? email.toLowerCase() : undefined,
        name: name || (email ? email.split("@")[0] : "Typist"),
        photo: picture || "",
        level: 1,
        xp: 0,
        badges: [],
      });
    }

    const { wpm = 0, accuracy = 0, timeSeconds = 0 } = req.body;
    const safeWpm = Number(wpm) || 0;
    const safeAcc = Number(accuracy) || 0;

    // Check pass criteria
    const passedWpm = challenge.targetWpm ? safeWpm >= challenge.targetWpm : true;
    const passedAcc = challenge.targetAccuracy ? safeAcc >= challenge.targetAccuracy : true;
    const passed = passedWpm && passedAcc;

    // Check if user previously passed this challenge
    const priorPass = await ChallengeAttempt.findOne({
      challenge: challenge._id,
      user: user._id,
      passed: true,
    });

    let earnedXp = 0;
    let earnedBadge = null;

    if (passed && !priorPass) {
      // First time completion bonus
      earnedXp = challenge.xpReward || 100;
      user.xp = (user.xp || 0) + earnedXp;

      // Award specific challenge badge reward if defined
      if (challenge.badgeReward) {
        const hasBadge = user.badges.some(
          (b) => b.toString() === challenge.badgeReward._id.toString(),
        );
        if (!hasBadge) {
          user.badges.push(challenge.badgeReward._id);
          earnedBadge = challenge.badgeReward;
        }
      }
    }

    // Save attempt record
    const attempt = await ChallengeAttempt.create({
      challenge: challenge._id,
      user: user._id,
      wpm: safeWpm,
      accuracy: safeAcc,
      timeSeconds: Number(timeSeconds) || 0,
      passed,
      earnedXp,
      finished: true,
    });

    // Update streak
    updateStreak(user, new Date());

    // Check general badge criteria (e.g. daily-challenger, weekly-champion, speed badges)
    const newBadges = await checkAndAwardBadges(user, {
      challengeAttempt: attempt,
      challenge,
    });

    // Level calculation
    const oldLevel = user.level || 1;
    const newLevel = calculateLevel(user.xp);
    const leveledUp = newLevel > oldLevel;
    user.level = newLevel;

    await user.save();

    return res.status(201).json({
      message: passed ? "Challenge passed!" : "Challenge attempt recorded.",
      passed,
      attempt,
      earnedXp,
      earnedBadge,
      newBadges,
      leveledUp,
      user: {
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
