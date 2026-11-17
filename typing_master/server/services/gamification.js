const Badge = require("../models/badge");
const TestResult = require("../models/test-result");

// Standard Badges Configuration
const DEFAULT_BADGES = [
  {
    slug: "first-test",
    name: "First Keystroke",
    description: "Completed your first typing test.",
    icon: "Flag",
    criteria: { type: "testCount", count: 1 },
    xpReward: 25,
  },
  {
    slug: "tests-10",
    name: "Keyboard Explorer",
    description: "Completed 10 typing tests.",
    icon: "Compass",
    criteria: { type: "testCount", count: 10 },
    xpReward: 50,
  },
  {
    slug: "tests-50",
    name: "Typing Veteran",
    description: "Completed 50 typing tests.",
    icon: "Shield",
    criteria: { type: "testCount", count: 50 },
    xpReward: 100,
  },
  {
    slug: "tests-100",
    name: "Century Club",
    description: "Reached 100 completed typing tests.",
    icon: "Award",
    criteria: { type: "testCount", count: 100 },
    xpReward: 200,
  },
  {
    slug: "tests-1000",
    name: "Grandmaster Typist",
    description: "Completed 1,000 typing tests. A legendary achievement!",
    icon: "Crown",
    criteria: { type: "testCount", count: 1000 },
    xpReward: 1000,
  },
  {
    slug: "speed-50",
    name: "Swift Hands (50 WPM)",
    description: "Achieved 50+ WPM in a typing test.",
    icon: "Zap",
    criteria: { type: "wpm", value: 50 },
    xpReward: 50,
  },
  {
    slug: "speed-80",
    name: "Speed Demon (80 WPM)",
    description: "Achieved 80+ WPM in a typing test.",
    icon: "Flame",
    criteria: { type: "wpm", value: 80 },
    xpReward: 100,
  },
  {
    slug: "speed-100",
    name: "Centurion (100 WPM)",
    description: "Broke the 100+ WPM speed barrier!",
    icon: "Sparkles",
    criteria: { type: "wpm", value: 100 },
    xpReward: 250,
  },
  {
    slug: "accuracy-perfectionist",
    name: "Perfectionist (100% Accuracy)",
    description: "Finished a test with 100% accuracy and at least 30 WPM.",
    icon: "Target",
    criteria: { type: "accuracy", value: 100, minWpm: 30 },
    xpReward: 100,
  },
  {
    slug: "streak-3",
    name: "3-Day Momentum",
    description: "Maintained a 3-day typing streak.",
    icon: "Flame",
    criteria: { type: "streak", count: 3 },
    xpReward: 50,
  },
  {
    slug: "streak-7",
    name: "7-Day Streak Master",
    description: "Maintained a 7-day uninterrupted typing streak!",
    icon: "Trophy",
    criteria: { type: "streak", count: 7 },
    xpReward: 150,
  },
  {
    slug: "daily-challenger",
    name: "Daily Challenger",
    description: "Completed a Daily Challenge.",
    icon: "Calendar",
    criteria: { type: "challenge", challengeType: "daily" },
    xpReward: 75,
  },
  {
    slug: "weekly-champion",
    name: "Weekly Champion",
    description: "Completed a Weekly Challenge.",
    icon: "Trophy",
    criteria: { type: "challenge", challengeType: "weekly" },
    xpReward: 150,
  },
  {
    slug: "bangla-typist",
    name: "বাংলা টাইপিস্ট",
    description: "Completed a typing test in Bangla with 90%+ accuracy.",
    icon: "PenTool",
    criteria: { type: "language", language: "bangla", minAcc: 90 },
    xpReward: 75,
  },
];

/** Seed default badges if not already present. */
async function seedBadges() {
  for (const b of DEFAULT_BADGES) {
    await Badge.findOneAndUpdate(
      { slug: b.slug },
      { $setOnInsert: b },
      { upsert: true, new: true },
    );
  }
}

/** Level calculation from XP. */
function calculateLevel(totalXp) {
  return Math.max(1, Math.floor(Math.sqrt((totalXp || 0) / 50)) + 1);
}

/** XP calculation for a single test. */
function calculateTestXp(wpm, accuracy) {
  const safeWpm = Math.max(0, Number(wpm) || 0);
  const safeAcc = Math.max(0, Math.min(100, Number(accuracy) || 0));

  let xp = Math.round(safeWpm * (safeAcc / 100) * 1.2);

  // Bonus XP for high accuracy
  if (safeAcc === 100 && safeWpm > 20) {
    xp += 25;
  } else if (safeAcc >= 98 && safeWpm > 20) {
    xp += 15;
  } else if (safeAcc >= 95 && safeWpm > 20) {
    xp += 10;
  }

  return Math.max(5, xp);
}

/** Update user streak based on activity date. */
function updateStreak(user, date = new Date()) {
  if (!user.streak) {
    user.streak = { current: 0, best: 0, lastActiveDate: "" };
  }

  const todayStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const lastStr = user.streak.lastActiveDate;

  if (lastStr === todayStr) {
    // Already active today
    return user.streak;
  }

  if (!lastStr) {
    // First active day
    user.streak.current = 1;
    user.streak.best = Math.max(user.streak.best || 0, 1);
    user.streak.lastActiveDate = todayStr;
    return user.streak;
  }

  // Calculate difference in days
  const todayMs = new Date(todayStr).getTime();
  const lastMs = new Date(lastStr).getTime();
  const diffDays = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day
    user.streak.current = (user.streak.current || 0) + 1;
    user.streak.best = Math.max(user.streak.best || 0, user.streak.current);
  } else if (diffDays > 1) {
    // Streak broken
    user.streak.current = 1;
  }

  user.streak.lastActiveDate = todayStr;
  return user.streak;
}

/**
 * Check criteria and award unearned badges to user.
 * Returns array of newly unlocked Badge documents.
 */
async function checkAndAwardBadges(user, context = {}) {
  const allBadges = await Badge.find();
  const earnedBadgeIds = new Set((user.badges || []).map((b) => b.toString()));
  const newBadgesEarned = [];

  const totalTests = await TestResult.countDocuments({ user: user._id });
  const streak = user.streak?.current || 0;
  const { testResult, challengeAttempt, challenge } = context;

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge._id.toString())) continue;

    const { type, count, value, minWpm, minAcc, language, challengeType } =
      badge.criteria || {};

    let qualified = false;

    switch (type) {
      case "testCount":
        if (totalTests >= count) qualified = true;
        break;

      case "wpm":
        if (testResult && testResult.wpm >= value) qualified = true;
        break;

      case "accuracy":
        if (
          testResult &&
          testResult.accuracy >= value &&
          (!minWpm || testResult.wpm >= minWpm)
        ) {
          qualified = true;
        }
        break;

      case "streak":
        if (streak >= count) qualified = true;
        break;

      case "challenge":
        if (
          challengeAttempt &&
          challengeAttempt.passed &&
          challenge &&
          challenge.type === challengeType
        ) {
          qualified = true;
        }
        break;

      case "language":
        if (
          testResult &&
          testResult.language === language &&
          (!minAcc || testResult.accuracy >= minAcc)
        ) {
          qualified = true;
        }
        break;
    }

    if (qualified) {
      user.badges.push(badge._id);
      earnedBadgeIds.add(badge._id.toString());
      user.xp = (user.xp || 0) + (badge.xpReward || 0);
      newBadgesEarned.push(badge);
    }
  }

  return newBadgesEarned;
}

module.exports = {
  seedBadges,
  calculateLevel,
  calculateTestXp,
  updateStreak,
  checkAndAwardBadges,
};
