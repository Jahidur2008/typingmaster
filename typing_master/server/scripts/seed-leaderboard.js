const mongoose = require("mongoose");
const User = require("../models/user");
const TestResult = require("../models/test-result");

const SAMPLE_USERS = [
  { name: "Tanvir Hasan", country: "BD", level: 12, xp: 7500, photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" },
  { name: "Sarah Jenkins", country: "US", level: 14, xp: 9800, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
  { name: "Arif Rahman", country: "BD", level: 9, xp: 4200, photo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100" },
  { name: "Liam O'Connor", country: "GB", level: 11, xp: 6200, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
  { name: "Priya Sharma", country: "IN", level: 10, xp: 5400, photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" },
  { name: "Kenji Sato", country: "JP", level: 15, xp: 11500, photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
  { name: "Nusrat Jahan", country: "BD", level: 8, xp: 3500, photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
  { name: "Felix Mueller", country: "DE", level: 13, xp: 8700, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" },
  { name: "Chloe Tremblay", country: "CA", level: 10, xp: 5200, photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" },
  { name: "Jack Miller", country: "AU", level: 7, xp: 2900, photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100" },
  { name: "Mahmudul Haque", country: "BD", level: 16, xp: 13000, photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100" },
  { name: "Elena Rostova", country: "US", level: 12, xp: 7100, photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
];

async function seedLeaderboard() {
  const resultCount = await TestResult.countDocuments();
  if (resultCount >= 20) {
    return;
  }

  console.log("[seed-leaderboard] Seeding sample leaderboard typists and test results...");

  const now = Date.now();
  const createdUsers = [];

  for (const u of SAMPLE_USERS) {
    let user = await User.findOne({ name: u.name });
    if (!user) {
      user = await User.create({
        name: u.name,
        country: u.country,
        photo: u.photo,
        level: u.level,
        xp: u.xp,
        role: "user",
      });
    } else {
      user.country = u.country;
      user.photo = u.photo;
      await user.save();
    }
    createdUsers.push(user);
  }

  // Predefined speeds (WPM) to establish realistic ranking ladder
  const scores = [
    { wpm: 124, raw: 131, acc: 99.2, cons: 88, lang: "english", mode: "time", dur: 60, offsetHours: 2 },
    { wpm: 118, raw: 122, acc: 98.5, cons: 85, lang: "english", mode: "time", dur: 60, offsetHours: 5 },
    { wpm: 112, raw: 115, acc: 97.8, cons: 82, lang: "english", mode: "time", dur: 60, offsetHours: 12 },
    { wpm: 106, raw: 110, acc: 98.1, cons: 79, lang: "english", mode: "time", dur: 60, offsetHours: 28 }, // yesterday
    { wpm: 101, raw: 107, acc: 96.5, cons: 81, lang: "english", mode: "time", dur: 60, offsetHours: 35 },
    { wpm: 97,  raw: 102, acc: 97.0, cons: 76, lang: "english", mode: "time", dur: 60, offsetHours: 72 }, // 3 days ago
    { wpm: 92,  raw: 98,  acc: 95.8, cons: 74, lang: "english", mode: "time", dur: 60, offsetHours: 96 },
    { wpm: 88,  raw: 92,  acc: 96.2, cons: 78, lang: "english", mode: "time", dur: 60, offsetHours: 140 }, // 6 days ago
    { wpm: 84,  raw: 89,  acc: 95.0, cons: 72, lang: "english", mode: "time", dur: 60, offsetHours: 200 }, // 8 days ago
    { wpm: 79,  raw: 84,  acc: 94.5, cons: 70, lang: "english", mode: "time", dur: 60, offsetHours: 280 },
    { wpm: 74,  raw: 80,  acc: 93.8, cons: 68, lang: "english", mode: "time", dur: 60, offsetHours: 400 },
    { wpm: 68,  raw: 73,  acc: 92.5, cons: 65, lang: "english", mode: "time", dur: 60, offsetHours: 600 },
  ];

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const user = createdUsers[i % createdUsers.length];
    const date = new Date(now - s.offsetHours * 3600 * 1000);

    await TestResult.create({
      user: user._id,
      mode: s.mode,
      duration: s.dur,
      language: s.lang,
      wpm: s.wpm,
      rawWpm: s.raw,
      accuracy: s.acc,
      consistency: s.cons,
      createdAt: date,
      updatedAt: date,
    });
  }

  // Also seed some 15s and words:50 scores and Bangla scores
  const banglaScores = [
    { user: createdUsers[0], wpm: 78, raw: 82, acc: 98.4, cons: 80, date: new Date(now - 3 * 3600 * 1000) },
    { user: createdUsers[2], wpm: 72, raw: 76, acc: 97.2, cons: 75, date: new Date(now - 14 * 3600 * 1000) },
    { user: createdUsers[6], wpm: 65, raw: 70, acc: 96.0, cons: 73, date: new Date(now - 30 * 3600 * 1000) },
    { user: createdUsers[10], wpm: 84, raw: 89, acc: 98.8, cons: 84, date: new Date(now - 6 * 3600 * 1000) },
  ];

  for (const b of banglaScores) {
    await TestResult.create({
      user: b.user._id,
      mode: "time",
      duration: 60,
      language: "bangla",
      wpm: b.wpm,
      rawWpm: b.raw,
      accuracy: b.acc,
      consistency: b.cons,
      createdAt: b.date,
      updatedAt: b.date,
    });
  }

  console.log("[seed-leaderboard] Leaderboard seeded successfully.");
}

module.exports = { seedLeaderboard };
