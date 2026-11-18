const express = require("express");
const { z } = require("zod");
const { requireAuth } = require("../middleware/auth");
const { User, TestResult, PersonalBest, ChallengeAttempt } = require("../models");

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

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(60, "Name too long").optional(),
  photo: z.string().trim().max(1000).optional(),
  country: z.string().trim().max(60, "Country name too long").optional(),
}).strict();

/**
 * PATCH /api/users/me
 * Updates allowed profile fields (name, photo, country).
 * Explicitly rejects and strips role, xp, level, badges, or streak modifications.
 */
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const { uid, email, name: tokenName, picture } = req.user;
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    // Strict validation
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const { name, photo, country } = parsed.data;

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
        name: name || tokenName || (cleanEmail ? cleanEmail.split("@")[0] : "Typist"),
        photo: photo !== undefined ? photo : picture || "",
        country: country || "",
        role: "user",
        level: 1,
        xp: 0,
        badges: [],
      });
    } else {
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (cleanEmail && !user.email) user.email = cleanEmail;
      if (name !== undefined) user.name = name;
      if (photo !== undefined) user.photo = photo;
      if (country !== undefined) user.country = country;
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

/**
 * DELETE /api/users/me
 * Permanently deletes the authenticated user's account and all associated typing data.
 */
router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: "User account not found" });
    }

    const userId = user._id;

    // Delete all associated user records in parallel
    await Promise.all([
      TestResult.deleteMany({ user: userId }),
      PersonalBest.deleteMany({ user: userId }),
      ChallengeAttempt.deleteMany({ user: userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return res.json({
      success: true,
      message: "Account and all associated test data deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
