const express = require("express");
const mongoose = require("mongoose");
const TestResult = require("../models/test-result");
const User = require("../models/user");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * Helper to build the match filter for test results based on query params.
 */
function buildMatchFilter(query) {
  const {
    timeframe = "global",
    language = "english",
    mode = "time",
    modeConfig,
  } = query;

  const match = {
    user: { $exists: true, $ne: null },
  };

  // Language filter
  if (language && language !== "all") {
    match.language = language;
  }

  // Mode & configuration filter
  if (mode && mode !== "all") {
    match.mode = mode;
    if (modeConfig) {
      const configNum = parseInt(modeConfig, 10);
      if (!isNaN(configNum)) {
        if (mode === "time") {
          match.duration = configNum;
        } else if (mode === "words") {
          match.wordCount = configNum;
        }
      }
    }
  }

  // Timeframe filter
  const now = new Date();
  if (timeframe === "daily") {
    // Last 24 hours or start of UTC day
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    match.createdAt = { $gte: startOfToday };
  } else if (timeframe === "weekly") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: sevenDaysAgo };
  } else if (timeframe === "monthly") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    match.createdAt = { $gte: thirtyDaysAgo };
  }

  return match;
}

/**
 * GET /api/leaderboard
 * Returns aggregated leaderboard rankings.
 */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const {
      timeframe = "global",
      language = "english",
      mode = "time",
      modeConfig = mode === "time" ? "60" : "50",
      country,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const matchFilter = buildMatchFilter({
      timeframe,
      language,
      mode,
      modeConfig,
    });

    // Aggregation pipeline:
    // 1. Filter results by match criteria
    // 2. Sort by highest WPM, then accuracy, then oldest timestamp
    // 3. Group by user to pick their BEST performance
    // 4. Join user details (name, photo, country, level)
    // 5. Optional country match
    // 6. Facet for total count and paginated items
    const pipeline = [
      { $match: matchFilter },
      { $sort: { wpm: -1, accuracy: -1, createdAt: 1 } },
      {
        $group: {
          _id: "$user",
          bestResultId: { $first: "$_id" },
          wpm: { $first: "$wpm" },
          rawWpm: { $first: "$rawWpm" },
          accuracy: { $first: "$accuracy" },
          consistency: { $first: "$consistency" },
          mode: { $first: "$mode" },
          duration: { $first: "$duration" },
          wordCount: { $first: "$wordCount" },
          language: { $first: "$language" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
    ];

    if (country && country !== "all") {
      pipeline.push({
        $match: {
          "userDoc.country": { $regex: new RegExp(`^${country}$`, "i") },
        },
      });
    }

    pipeline.push({
      $sort: { wpm: -1, accuracy: -1, createdAt: 1 },
    });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        entries: [
          { $skip: skip },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              bestResultId: 1,
              wpm: 1,
              rawWpm: 1,
              accuracy: 1,
              consistency: 1,
              mode: 1,
              duration: 1,
              wordCount: 1,
              language: 1,
              createdAt: 1,
              user: {
                _id: "$userDoc._id",
                firebaseUid: "$userDoc.firebaseUid",
                name: "$userDoc.name",
                photo: "$userDoc.photo",
                country: "$userDoc.country",
                level: "$userDoc.level",
              },
            },
          },
        ],
      },
    });

    const [result] = await TestResult.aggregate(pipeline);

    const total = result && result.metadata && result.metadata[0] ? result.metadata[0].total : 0;
    const rawEntries = (result && result.entries) || [];

    // Assign rank positions
    const entries = rawEntries.map((item, idx) => ({
      ...item,
      rank: skip + idx + 1,
    }));

    // If authenticated, check current user's rank
    let currentUserRank = null;
    if (req.user) {
      const authUser = await User.findOne({ firebaseUid: req.user.uid }).lean();
      if (authUser) {
        // Check if user is already inside current page entries
        const existing = entries.find((e) => e.user && e.user._id.toString() === authUser._id.toString());
        if (existing) {
          currentUserRank = {
            rank: existing.rank,
            wpm: existing.wpm,
            accuracy: existing.accuracy,
            createdAt: existing.createdAt,
            isInTopList: true,
          };
        } else {
          // Calculate rank by querying how many users scored better than authUser's best in this filter
          const userBestResult = await TestResult.findOne({
            user: authUser._id,
            ...matchFilter,
          })
            .sort({ wpm: -1, accuracy: -1 })
            .lean();

          if (userBestResult) {
            // Count unique users with a higher score
            const higherPipeline = [
              { $match: matchFilter },
              { $sort: { wpm: -1, accuracy: -1 } },
              {
                $group: {
                  _id: "$user",
                  wpm: { $first: "$wpm" },
                },
              },
              {
                $match: {
                  wpm: { $gt: userBestResult.wpm },
                },
              },
              { $count: "count" },
            ];

            const higherRes = await TestResult.aggregate(higherPipeline);
            const count = higherRes[0] ? higherRes[0].count : 0;
            currentUserRank = {
              rank: count + 1,
              wpm: userBestResult.wpm,
              accuracy: userBestResult.accuracy,
              createdAt: userBestResult.createdAt,
              isInTopList: false,
            };
          }
        }
      }
    }

    return res.json({
      entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      currentUserRank,
      filters: {
        timeframe,
        language,
        mode,
        modeConfig,
        country: country || "all",
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/leaderboard/countries
 * Returns list of distinct countries with typing records.
 */
router.get("/countries", async (req, res, next) => {
  try {
    const countries = await User.distinct("country", {
      country: { $exists: true, $nin: ["", null] },
    });

    // Return unique sorted list
    const cleaned = Array.from(new Set(countries.map((c) => (c ? c.trim().toUpperCase() : "")).filter(Boolean))).sort();

    return res.json({ countries: cleaned });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
