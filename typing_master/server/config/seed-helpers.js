const fs = require("fs");
const path = require("path");
const Word = require("../models/word");
const Quote = require("../models/quote");

const DATA_DIR = path.join(__dirname, "..", "..", "client", "data");

function loadJson(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function seedWords() {
  const files = ["english-words.json", "bangla-words.json"];
  for (const file of files) {
    const data = loadJson(file);
    if (!data) continue;
    const { language, words = [] } = data;
    await Word.deleteMany({ language });
    const docs = words.map((w, idx) => ({
      text: w,
      language,
      length: w.length,
      difficulty: 1,
      rank: idx + 1,
    }));
    if (docs.length > 0) {
      await Word.insertMany(docs, { ordered: false });
    }
  }
}

async function seedQuotes() {
  const data = loadJson("quotes.json");
  if (!data || !data.quotes) return;
  await Quote.deleteMany({});
  const docs = data.quotes.map((q) => ({
    text: q.text,
    source: q.source || "Unknown",
    lengthCategory: q.lengthCategory || "medium",
    language: q.language || "english",
    length: q.text.length,
  }));
  if (docs.length > 0) {
    await Quote.insertMany(docs, { ordered: false });
  }
}

module.exports = { seedWords, seedQuotes };
