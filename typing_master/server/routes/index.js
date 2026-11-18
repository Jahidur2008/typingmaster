/** All /api routes live here. */

const express = require("express");
const healthRoutes = require("./health");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const resultRoutes = require("./results");
const statsRoutes = require("./stats");
const courseRoutes = require("./courses");
const challengeRoutes = require("./challenges");
const leaderboardRoutes = require("./leaderboard");
const adminRoutes = require("./admin");
const contactRoutes = require("./contact");
const Setting = require("../models/setting");

const router = express.Router();

// Public site settings
router.get("/settings", async (req, res) => {
  try {
    let setting = null;
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState === 1) {
      setting = await Setting.findOne({ key: "site_config" }).maxTimeMS(3000);
      if (!setting) {
        setting = await Setting.create({ key: "site_config" });
      }
    }
    return res.json({
      siteName: setting?.siteName || "Typing Master",
      logoUrl: setting?.logoUrl || "",
      defaultTheme: setting?.defaultTheme || "obsidian",
      maintenanceMode: setting?.maintenanceMode || false,
      languages: setting?.languages || ["english", "bangla_avro", "bangla_bijoy"],
      layouts: setting?.layouts || ["qwerty"],
    });
  } catch (err) {
    return res.json({
      siteName: "Typing Master",
      logoUrl: "",
      defaultTheme: "obsidian",
      maintenanceMode: false,
      languages: ["english", "bangla_avro", "bangla_bijoy"],
      layouts: ["qwerty"],
    });
  }
});

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/results", resultRoutes);
router.use("/stats", statsRoutes);
router.use("/courses", courseRoutes);
router.use("/lessons", courseRoutes);
router.use("/challenges", challengeRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/admin", adminRoutes);
router.use("/contact", contactRoutes);

module.exports = router;
