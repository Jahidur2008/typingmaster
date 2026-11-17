const express = require("express");
const mongoose = require("mongoose");
const { connectionState, getLastError, getMaskedUri } = require("../config/db");

const router = express.Router();

const STATES = ["disconnected", "connected", "connecting", "disconnecting"];

/** GET /api/health — liveness + database status. */
router.get("/health", (req, res) => {
  const state = connectionState();
  const connected = state === 1;

  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    database: {
      state: STATES[state] ?? "unknown",
      connected,
      name: mongoose.connection.name || null,
      target: getMaskedUri(),
      error: getLastError(),
    },
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
