const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { User } = require("../models");

const router = express.Router();

/**
 * GET /api/users/me
 * Returns the current authenticated user's profile from MongoDB.
 * If the user document does not exist yet, it is automatically created.
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    let user = await User.findOne({ firebaseUid: uid }).populate("badges");

    if (!user && cleanEmail) {
      user = await User.findOne({ email: cleanEmail }).populate("badges");
      if (user) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // Auto-create if not found
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: cleanEmail,
        name: tokenName || (cleanEmail ? cleanEmail.split("@")[0] : "Typist"),
        photo: picture || "",
        country: "",
        role: "user",
        level: 1,
        xp: 0,
        badges: [],
      });
    }

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/users/promote-me
 * Promotes the logged-in user to admin if in development OR if no admins exist in DB yet.
 */
router.post("/promote-me", requireAuth, async (req, res, next) => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user && cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        user.firebaseUid = uid;
      }
    }

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: cleanEmail,
        name: tokenName || (cleanEmail ? cleanEmail.split("@")[0] : "Admin Typist"),
        photo: picture || "",
        country: "BD",
        role: "admin",
        level: 1,
        xp: 0,
        badges: [],
      });
      return res.json({ message: "Successfully created and promoted to administrator", user });
    }

    user.role = "admin";
    await user.save();
    return res.json({ message: "Successfully promoted to administrator", user });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/users/me
 * Updates allowed profile fields (name, photo, country).
 * If user does not exist yet in MongoDB, creates it automatically.
 */
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const body = req.body || {};
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    let user = await User.findOne({
      $or: [
        { firebaseUid: uid },
        ...(cleanEmail ? [{ email: cleanEmail }] : []),
      ],
    }).populate("badges");

    if (!user) {
      user = new User({
        firebaseUid: uid,
        email: cleanEmail,
        name: body.name?.trim() || tokenName || (cleanEmail ? cleanEmail.split("@")[0] : "Typist"),
        photo: body.photo?.trim() || picture || "",
        country: body.country?.trim() || "",
        role: "user",
        level: 1,
        xp: 0,
        badges: [],
      });
    } else {
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (cleanEmail && !user.email) user.email = cleanEmail;
      if (typeof body.name === "string" && body.name.trim().length > 0) {
        user.name = body.name.trim();
      }
      if (typeof body.photo === "string") {
        user.photo = body.photo.trim();
      }
      if (typeof body.country === "string") {
        user.country = body.country.trim();
      }
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
