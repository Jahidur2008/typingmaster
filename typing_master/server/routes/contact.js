const express = require("express");
const ContactMessage = require("../models/contact-message");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/contact
 * Public endpoint to submit a message from the /contact form.
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, category, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "All fields (name, email, subject, message) are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const doc = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category: ["general", "bug", "feature", "partnership", "other"].includes(category)
        ? category
        : "general",
      message: message.trim(),
      status: "unread",
      ip: typeof ip === "string" ? ip.split(",")[0].trim() : "",
      userAgent: typeof userAgent === "string" ? userAgent.slice(0, 200) : "",
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received. Our team will review it shortly.",
      id: doc._id,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/contact
 * Admin endpoint: list contact messages with filters and pagination.
 */
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (category && category !== "all") query.category = category;
    if (search && typeof search === "string" && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
    }

    const [messages, total, unreadCount] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ContactMessage.countDocuments(query),
      ContactMessage.countDocuments({ status: "unread" }),
    ]);

    return res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      unreadCount,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/contact/:id
 * Admin endpoint: update message status (read, resolved, archived) or admin note.
 */
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body || {};
    const update = {};

    if (status && ["unread", "read", "resolved", "archived"].includes(status)) {
      update.status = status;
    }
    if (adminNote !== undefined) {
      update.adminNote = String(adminNote);
    }

    const doc = await ContactMessage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) {
      return res.status(404).json({ error: "Contact message not found" });
    }

    return res.json({ success: true, message: "Message updated successfully", doc });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/contact/:id
 * Admin endpoint: delete a contact message.
 */
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Contact message not found" });
    }
    return res.json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
