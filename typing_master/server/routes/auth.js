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

    // 1. Search by firebaseUid OR email
    let user = await User.findOne({
      $or: [
        { firebaseUid: uid },
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
    }).populate("badges");

    const hasAdmin = await User.exists({ role: "admin" });

    if (user) {
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (cleanEmail && !user.email) user.email = cleanEmail;
      if (body.name?.trim()) user.name = body.name.trim();
      else if (!user.name) user.name = displayName;

      if (photoUrl && (!user.photo || body.photo)) user.photo = photoUrl;
      if (body.country !== undefined && body.country !== "") user.country = country;

      // Auto-assign admin if no admin exists yet
      if (!hasAdmin && user.role !== "admin") {
        user.role = "admin";
      }

      await user.save();

      return res.status(200).json({
        message: "User profile synced",
        isNew: false,
        user,
      });
    }

    // 2. Atomic upsert to guarantee zero duplicates even under concurrent calls
    try {
      user = await User.findOneAndUpdate(
        { firebaseUid: uid },
        {
          $setOnInsert: {
            firebaseUid: uid,
            email: cleanEmail,
            name: displayName,
            photo: photoUrl,
            country: country || "",
            role: !hasAdmin ? "admin" : "user",
            level: 1,
            xp: 0,
            badges: [],
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      ).populate("badges");

      return res.status(201).json({
        message: "User profile created and synced",
        isNew: true,
        user,
      });
    } catch (upsertErr) {
      // If concurrent request created it first (duplicate key 11000)
      user = await User.findOne({ firebaseUid: uid }).populate("badges");
      if (user) {
        return res.status(200).json({
          message: "User profile synced",
          isNew: false,
          user,
        });
      }
      throw upsertErr;
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
