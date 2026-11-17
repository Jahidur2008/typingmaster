/**
 * MongoDB connection via Mongoose.
 * Reads MONGODB_URI from server/.env. If local MongoDB is not running,
 * automatically falls back to an in-memory MongoDB instance for development.
 */

const mongoose = require("mongoose");

const DEFAULT_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://limonmalitha1_db_user:G7AKojyzSoxQQpfD@cluster0.zzcikpt.mongodb.net/typing_master?retryWrites=true&w=majority";

let connected = false;
let memServer = null;
let lastError = null;
let lastErrorTime = null;
let retryTimer = null;

function getLastError() {
  return lastError ? `${lastError} (at ${lastErrorTime})` : null;
}

function getMaskedUri() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  return uri.replace(/:([^@]+)@/, ":****@");
}

async function connectDB(uri) {
  if (connected && mongoose.connection.readyState === 1) return mongoose.connection;
  const connectionUri = uri || process.env.MONGODB_URI || DEFAULT_URI;

  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 15000,
    });
    connected = true;
    lastError = null;
    lastErrorTime = null;

    const { host, name, port } = conn.connection;
    console.log(`[db] MongoDB connected → ${host}:${port}/${name}`);

    mongoose.connection.on("error", (err) => {
      lastError = err.message;
      lastErrorTime = new Date().toISOString();
      console.error("[db] MongoDB runtime error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      connected = false;
      console.warn("[db] MongoDB disconnected — attempting reconnect in 5s...");
      scheduleRetry();
    });

    return conn;
  } catch (err) {
    lastError = err.message;
    lastErrorTime = new Date().toISOString();
    console.warn(
      `[db] Connection to "${getMaskedUri()}" failed: ${err.message}`,
    );

    // Development fallback to in-memory MongoDB
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[db] Spinning up MongoMemoryServer fallback for development...");
        const { MongoMemoryServer } = require("mongodb-memory-server");
        memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();

        const conn = await mongoose.connect(memUri);
        connected = true;

        console.log(`[db] In-memory MongoDB connected → ${memUri}`);

        // Seed words, quotes and courses if empty
        try {
          const Word = require("../models/word");
          const count = await Word.countDocuments();
          if (count === 0) {
            console.log("[db] Seeding initial words and quotes into in-memory database...");
            const { seedWords, seedQuotes } = require("./seed-helpers");
            if (seedWords && seedQuotes) {
              await seedWords();
              await seedQuotes();
            }
          }
          const Lesson = require("../models/lesson");
          const lessonCount = await Lesson.countDocuments();
          if (lessonCount === 0) {
            const { seedCourses } = require("../scripts/seed-courses");
            await seedCourses();
          }
          const Challenge = require("../models/challenge");
          const challengeCount = await Challenge.countDocuments();
          if (challengeCount === 0) {
            const { seedChallenges } = require("../scripts/seed-challenges");
            await seedChallenges();
          }
        } catch (seedErr) {
          console.warn("[db] Seeding error:", seedErr.message);
        }

        return conn;
      } catch (memErr) {
        console.error("[db] MongoMemoryServer fallback failed:", memErr.message);
      }
    }

    scheduleRetry();
    throw err;
  }
}

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (!connected || mongoose.connection.readyState !== 1) {
      console.log("[db] Retrying MongoDB connection...");
      try {
        await connectDB();
        console.log("[db] Reconnected to MongoDB successfully!");
      } catch (e) {
        // scheduleRetry was called inside catch
      }
    }
  }, 5000);
}

async function disconnectDB() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (connected) {
    await mongoose.disconnect();
    connected = false;
    console.log("[db] MongoDB connection closed");
  }
  if (memServer) {
    await memServer.stop();
    memServer = null;
    console.log("[db] MongoMemoryServer stopped");
  }
}

function connectionState() {
  return mongoose.connection.readyState;
}

module.exports = {
  connectDB,
  disconnectDB,
  connectionState,
  getLastError,
  getMaskedUri,
  DEFAULT_URI,
};
