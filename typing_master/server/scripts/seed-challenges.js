const Challenge = require("../models/challenge");
const Badge = require("../models/badge");
const { seedBadges } = require("../services/gamification");

/**
 * Returns the end of today (UTC midnight).
 */
function getEndOfToday() {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Returns the end of the current week (Sunday midnight UTC).
 */
function getEndOfWeek() {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = 7 - (day === 0 ? 7 : day); // days until next Sunday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

const DAILY_TEXTS = [
  "Consistency is the true foundation of mastery. Every single deliberate keystroke you press today rewires your subconscious muscle memory, transforming conscious effort into effortless, flowing speed.",
  "The art of typing is not about rushing the fingers; it is about calming the mind. When precision guides each stroke, speed naturally follows like water finding its easiest path.",
  "Small daily improvements over time lead to stunning results. Type with intention, focus on accuracy first, and watch your typing velocity steadily climb toward the century mark.",
  "Courage is not the absence of mistakes; it is typing right through them without losing your rhythm. Keep your eyes on the upcoming word and trust the memory built into your fingertips.",
];

async function seedChallenges() {
  await seedBadges();

  const dailyBadge = await Badge.findOne({ slug: "daily-challenger" });
  const weeklyBadge = await Badge.findOne({ slug: "weekly-champion" });
  const speedBadge = await Badge.findOne({ slug: "speed-80" });
  const accBadge = await Badge.findOne({ slug: "accuracy-perfectionist" });

  const todayIndex = new Date().getUTCDate() % DAILY_TEXTS.length;
  const todayText = DAILY_TEXTS[todayIndex];

  const CHALLENGES_SPEC = [
    {
      title: "Daily Focus: Rhythm & Precision",
      description: "Complete today's official community text. Same challenge for every typist around the globe today.",
      type: "daily",
      mode: "custom",
      text: todayText,
      targetWpm: 40,
      targetAccuracy: 95,
      xpReward: 150,
      badgeReward: dailyBadge?._id,
      endsAt: getEndOfToday(),
      active: true,
    },
    {
      title: "Weekly Marathon: Deep Endurance",
      description: "A comprehensive literary sprint to test your sustained pace and mental stamina across a full paragraph.",
      type: "weekly",
      mode: "custom",
      text: "Touch typing is an extraordinary bridge between pure human thought and digital expression. When you no longer need to look down at the plastic keyboard, the friction between your mind and the screen disappears entirely. Writers draft without hesitation, programmers compose code at the speed of logic, and ideas manifest into reality with seamless grace. Dedicate yourself to this discipline every week.",
      targetWpm: 50,
      targetAccuracy: 94,
      xpReward: 300,
      badgeReward: weeklyBadge?._id,
      endsAt: getEndOfWeek(),
      active: true,
    },
    {
      title: "Speed Blitz: 75 WPM Sprint",
      description: "Push your finger dexterity to the limit. Reach at least 75 WPM with 92%+ accuracy on standard vocabulary.",
      type: "speed",
      mode: "words",
      text: "fast swift lightning velocity rapid quick flash surge ignite spark burst blaze sprint accelerate instant rush dynamic tempo rhythm blast race drive drift soar leap",
      targetWpm: 75,
      targetAccuracy: 92,
      xpReward: 200,
      badgeReward: speedBadge?._id,
      active: true,
    },
    {
      title: "Sniper Accuracy: 98%+ Precision",
      description: "Zero room for sloppiness. Complete the exercise with at least 98% accuracy and minimum 35 WPM.",
      type: "accuracy",
      mode: "custom",
      text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away. Every character in this text must be typed with absolute care and zero careless typos.",
      targetWpm: 35,
      targetAccuracy: 98,
      xpReward: 250,
      badgeReward: accBadge?._id,
      active: true,
    },
  ];

  for (const spec of CHALLENGES_SPEC) {
    await Challenge.findOneAndUpdate(
      { type: spec.type },
      { $set: spec },
      { upsert: true, new: true },
    );
  }

  console.log("[seed] Daily, Weekly, Speed, and Accuracy challenges seeded.");
}

module.exports = { seedChallenges };
