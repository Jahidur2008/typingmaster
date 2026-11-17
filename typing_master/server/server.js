const path = require("path");
require("dotenv").config();
// Load admin credentials from admin.env
require("dotenv").config({ path: path.join(__dirname, "admin.env") });
require("dotenv").config({ path: path.join(__dirname, "../admin.env") });

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const apiRouter = require("./routes");
const { notFound, errorHandler } = require("./middleware/error");
const { setupCompetitionSocket } = require("./services/competition-socket");
const { seedChallenges } = require("./scripts/seed-challenges");
const { seedLeaderboard } = require("./scripts/seed-leaderboard");

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

async function main() {
  // Start even if the database is unreachable — /api/health reports the
  // degraded state and Mongoose keeps retrying in the background.
  try {
    await connectDB();
    // Register all Mongoose models
    require("./models");
    await seedChallenges();
    await seedLeaderboard();
  } catch {
    console.warn("[server] continuing without database — /api/health will report degraded");
  }

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setupCompetitionSocket(io);

  app.use(
    cors({
      origin: CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiRouter);

  // 404 for unmatched API routes, then the central error handler.
  app.use("/api", notFound);
  app.use(errorHandler);

  server.listen(PORT, () => {
    console.log(`[server] API listening on http://localhost:${PORT}`);
    console.log(`[server] Socket.io active for live competition`);
    console.log(`[server] CORS origin: ${CORS_ORIGIN}`);
  });

  // Graceful shutdown.
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      console.log(`\n[server] ${signal} received — shutting down`);
      const { disconnectDB } = require("./config/db");
      await disconnectDB();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("[server] fatal startup error:", err.message);
  process.exit(1);
});
