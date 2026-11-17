/**
 * Seed script — loads the client word pools and quotes JSON into MongoDB.
 *
 *   cd server && npm run seed
 *
 * Words/quotes are replaced per language (idempotent re-runs).
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { connectDB, disconnectDB } = require("../config/db");
const Word = require("../models/word");
const Quote = require("../models/quote");

const DATA_DIR = path.join(__dirname, "..", "..", "client", "data");

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
}

async function seedWords() {
  const files = ["english-words.json", "bangla-words.json"];
  let total = 0;

  for (const file of files) {
    const data = loadJson(file);
    const language = data.language;
    const words = data.words || [];
    if (!language || words.length === 0) continue;

    // Replace the pool for this language so re-runs stay idempotent.
    const { deletedCount } = await Word.deleteMany({ language });
    await Word.insertMany(words.map((text) => ({ language, text })), {
      ordered: false,
    });
    total += words.length;
    console.log(
      `[seed] words · ${language}: ${words.length} inserted` +
        (deletedCount ? ` (${deletedCount} previous removed)` : ""),
    );
  }
  return total;
}

async function seedQuotes() {
  const data = loadJson("quotes.json");
  const quotes = data.quotes || [];
  const { deletedCount } = await Quote.deleteMany({});
  await Quote.insertMany(
    quotes.map(({ language, text, source, length }) => ({
      language,
      text,
      source,
      length,
    })),
    { ordered: false },
  );
  console.log(
    `[seed] quotes: ${quotes.length} inserted` +
      (deletedCount ? ` (${deletedCount} previous removed)` : ""),
  );
  return quotes.length;
}

async function seedAll() {
  await connectDB();
  const words = await seedWords();
  const quotes = await seedQuotes();
  console.log(`[seed] done — ${words} words, ${quotes} quotes`);
}

async function main() {
  await seedAll();
  await disconnectDB();
}

// Only auto-run when executed directly (npm run seed); exportable for tests.
if (require.main === module) {
  main().catch((err) => {
    console.error("[seed] failed:", err.message);
    process.exit(1);
  });
}

module.exports = { seedAll, seedWords, seedQuotes };
