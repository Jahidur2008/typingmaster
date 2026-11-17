/** All /api routes live here. */

const express = require("express");
const healthRoutes = require("./health");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const resultRoutes = require("./results");
const courseRoutes = require("./courses");
const challengeRoutes = require("./challenges");
const leaderboardRoutes = require("./leaderboard");
const adminRoutes = require("./admin");
const contactRoutes = require("./contact");
const Setting = require("../models/setting");

const router = express.Router();

// Public site settings
router.get("/settings", async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: "site_config" });
    if (!setting) {
      setting = await Setting.create({ key: "site_config" });
    }
    return res.json({
      siteName: setting.siteName,
      logoUrl: setting.logoUrl,
      defaultTheme: setting.defaultTheme,
      maintenanceMode: setting.maintenanceMode,
      languages: setting.languages,
      layouts: setting.layouts,
    });
  } catch (err) {
    return next(err);
  }
});

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/results", resultRoutes);
router.use("/courses", courseRoutes);
router.use("/lessons", courseRoutes);
router.use("/challenges", challengeRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/admin", adminRoutes);
router.use("/contact", contactRoutes);

module.exports = router;
