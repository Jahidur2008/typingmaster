/**
 * One-off verification against an in-memory MongoDB (dev tooling only):
 * boots a real mongod binary in memory, runs the seed, checks the
 * models round-trip, then shuts everything down.
 *
 *   node scripts/verify-seed.js
 */

const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  console.log("[verify] starting in-memory MongoDB…");
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("typing-master");

  try {
    const { seedAll } = require("./seed");
    await seedAll();

    const { User, TestResult, PersonalBest, Word, Quote, Course, Lesson, Challenge, ChallengeAttempt, Badge } = require("../models");

    // Round-trip every model to prove the schemas work end to end.
    const user = await User.create({
      firebaseUid: "test-uid",
      name: "Test User",
      email: "test@example.com",
      role: "admin",
      country: "BD",
      xp: 120,
    });
    const word = await Word.findOne({ language: "english" });
    const quote = await Quote.findOne({ language: "bangla" });
    const badge = await Badge.create({
      name: "Century",
      slug: "century",
      description: "Reach 100 WPM",
      criteria: { type: "wpm", value: 100 },
      xpReward: 50,
    });
    const course = await Course.create({ title: "Bangla Basics", slug: "bangla-basics", language: "bangla" });
    const lesson = await Lesson.create({ course: course._id, title: "Home row", order: 1 });
    const challenge = await Challenge.create({ title: "Daily sprint", mode: "time", config: { timeSeconds: 60 } });
    const result = await TestResult.create({
      user: user._id,
      mode: "time",
      duration: 30,
      language: "english",
      wpm: 72.4,
      rawWpm: 78.1,
      accuracy: 96.2,
      consistency: 81.5,
      chars: { correct: 216, incorrect: 8, extra: 2, missed: 3 },
      wpmPerSecond: [
        { second: 1, wpm: 40, rawWpm: 46, errors: 1 },
        { second: 2, wpm: 52, rawWpm: 55, errors: 0 },
      ],
    });
    await PersonalBest.create({
      user: user._id,
      mode: "time",
      config: { timeSeconds: 30 },
      wpm: 72.4,
      accuracy: 96.2,
    });
    await ChallengeAttempt.create({
      challenge: challenge._id,
      user: user._id,
      wpm: 68.9,
      accuracy: 94.0,
    });

    const counts = {
      users: await User.countDocuments(),
      testResults: await TestResult.countDocuments(),
      personalBests: await PersonalBest.countDocuments(),
      words: await Word.countDocuments(),
      wordsEnglish: await Word.countDocuments({ language: "english" }),
      wordsBangla: await Word.countDocuments({ language: "bangla" }),
      quotes: await Quote.countDocuments(),
      quotesEnglish: await Quote.countDocuments({ language: "english" }),
      quotesBangla: await Quote.countDocuments({ language: "bangla" }),
      courses: await Course.countDocuments(),
      lessons: await Lesson.countDocuments(),
      challenges: await Challenge.countDocuments(),
      challengeAttempts: await ChallengeAttempt.countDocuments(),
      badges: await Badge.countDocuments(),
    };
    console.log("[verify] counts:", JSON.stringify(counts));

    // Assertions.
    const assert = (cond, msg) => {
      if (!cond) throw new Error(`FAILED: ${msg}`);
      console.log(`[verify] ok — ${msg}`);
    };
    assert(counts.words > 1000, "word pool seeded (>1000 total)");
    assert(counts.wordsEnglish > 1000 && counts.wordsBangla > 0, "english + bangla words present");
    assert(counts.quotes > 30 && counts.quotesBangla > 0, "quotes seeded (both languages)");
    assert(quote.text.length > 10, "bangla quote text preserved as UTF-8");
    assert(counts.users === 1 && counts.testResults === 1, "user + result round-trip");
    assert(result.wpmPerSecond.length === 2, "wpmPerSecond array stored");
    assert(user.badges.length === 0 && counts.badges === 1, "badge model works");
    assert(lesson.course.equals(course._id), "lesson ↔ course reference works");

    console.log("[verify] ALL PASSED");
  } finally {
    const { disconnectDB } = require("../config/db");
    await disconnectDB();
    await mongod.stop();
    console.log("[verify] in-memory MongoDB stopped");
  }
}

main().catch((err) => {
  console.error("[verify] failed:", err);
  process.exit(1);
});
