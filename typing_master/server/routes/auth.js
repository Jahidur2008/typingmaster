const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { User } = require("../models");

const router = express.Router();

/**
 * POST /api/auth/sync
 * Syncs the authenticated Firebase user with MongoDB.
 * Creates a new User document if one does not exist, or updates
 * an existing one (matching by firebaseUid or email).
 */
router.post("/sync", requireAuth, async (req, res, next) => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const body = req.body || {};

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const displayName = body.name?.trim() || tokenName || (cleanEmail ? cleanEmail.split("@")[0] : "Typist");
    const photoUrl = body.photo?.trim() || picture || "";
    const country = body.country?.trim() || "";

    // 1. Search by firebaseUid
    let user = await User.findOne({ firebaseUid: uid }).populate("badges");

    // 2. If not found by UID, search by email to link legacy or existing accounts
    if (!user && cleanEmail) {
      user = await User.findOne({ email: cleanEmail }).populate("badges");
      if (user) {
        user.firebaseUid = uid;
      }
    }

    const hasAdmin = await User.exists({ role: "admin" });

    if (user) {
      // Update existing record if new info provided
      if (body.name?.trim()) user.name = body.name.trim();
      else if (!user.name) user.name = displayName;

      if (photoUrl && (!user.photo || body.photo)) user.photo = photoUrl;
      if (body.country !== undefined) user.country = country;
      if (cleanEmail && !user.email) user.email = cleanEmail;

      // Auto-assign admin if no admin exists yet
      if (!hasAdmin) {
        user.role = "admin";
      }

      await user.save();

      return res.status(200).json({
        message: "User profile synced",
        isNew: false,
        user,
      });
    }

    // 3. Create new user (first user is admin)
    user = new User({
      firebaseUid: uid,
      email: cleanEmail,
      name: displayName,
      photo: photoUrl,
      country,
      role: !hasAdmin ? "admin" : "user",
      level: 1,
      xp: 0,
      badges: [],
    });

    await user.save();

    return res.status(201).json({
      message: "User profile created and synced",
      isNew: true,
      user,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
