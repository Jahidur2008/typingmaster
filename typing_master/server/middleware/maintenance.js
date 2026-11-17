const Setting = require("../models/setting");
const { verifyAdminToken } = require("../services/admin-auth");

/**
 * Middleware that checks if Maintenance Mode is active.
 * If active, requests from non-admin users are rejected with HTTP 503.
 * Requests from admins (via x-admin-token or admin session) pass through unimpeded.
 */
async function checkMaintenance(req, res, next) {
  try {
    const setting = await Setting.findOne({ key: "site_config" });
    if (!setting || !setting.maintenanceMode) {
      return next();
    }

    // 1. Check x-admin-token header or admin Bearer token
    const adminToken =
      req.headers["x-admin-token"] ||
      (req.headers.authorization && req.headers.authorization.startsWith("Admin ")
        ? req.headers.authorization.slice(6)
        : null);

    if (adminToken && verifyAdminToken(adminToken)) {
      return next();
    }

    // 2. Check if req.user has admin role (from auth middleware)
    if (req.user && req.user.role === "admin") {
      return next();
    }

    // 3. Otherwise reject test/game submissions while under maintenance
    return res.status(503).json({
      error: "Typing Master is currently under maintenance. Submissions are temporarily paused.",
      maintenance: true,
    });
  } catch (err) {
    // Fail-open to avoid service outage if setting query fails
    return next();
  }
}

module.exports = { checkMaintenance };
