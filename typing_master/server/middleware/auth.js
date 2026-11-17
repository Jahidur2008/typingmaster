/**
 * Firebase ID token verification middleware.
 *
 * Verifies Bearer token sent in Authorization header using firebase-admin auth.
 * On success, attaches decoded token payload to `req.user`.
 */

const { auth, isConfigured } = require("../config/firebase");
const User = require("../models/user");
const { verifyAdminToken } = require("../services/admin-auth");

async function requireAuth(req, res, next) {
  if (!isConfigured || !auth) {
    return res.status(503).json({
      error: "Authentication service unavailable — Firebase Admin credentials not configured on server",
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization header missing or invalid. Format should be: Bearer <token>",
    });
  }

  const idToken = authHeader.split("Bearer ")[1].trim();
  if (!idToken) {
    return res.status(401).json({
      error: "Bearer token was empty",
    });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;

    // Check if user is banned
    const dbUser = await User.findOne({ firebaseUid: decodedToken.uid }).select("isBanned role");
    if (dbUser && dbUser.isBanned) {
      return res.status(403).json({
        error: "Your account has been banned by an administrator.",
      });
    }

    return next();
  } catch (err) {
    console.error("[auth] Token verification failed:", err.message);
    return res.status(401).json({
      error: "Invalid or expired authorization token",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

async function optionalAuth(req, res, next) {
  if (!isConfigured || !auth) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const idToken = authHeader.split("Bearer ")[1].trim();
  if (!idToken) return next();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
  } catch {
    // Invalid/expired token in optionalAuth: continue as unauthenticated guest
  }
  return next();
}

/**
 * Strict Admin-only middleware.
 * Verifies ID token AND checks MongoDB for role === "admin"
 */
async function requireAdmin(req, res, next) {
  // Check x-admin-token first (direct admin token)
  const directAdminToken = req.headers["x-admin-token"];
  if (directAdminToken) {
    const adminSession = verifyAdminToken(directAdminToken);
    if (adminSession) {
      req.user = { uid: "master_admin", name: adminSession.username, role: "admin" };
      req.mongoUser = { name: adminSession.username, role: "admin", email: "admin@typingmaster.local" };
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization header missing or invalid. Format should be: Bearer <token>",
    });
  }

  const idToken = authHeader.split("Bearer ")[1].trim();
  if (!idToken) {
    return res.status(401).json({
      error: "Bearer token was empty",
    });
  }

  // 1. Check if token is signed Master Admin Session Token from admin.env
  const adminSession = verifyAdminToken(idToken);
  if (adminSession) {
    req.user = { uid: "master_admin", name: adminSession.username, role: "admin" };
    req.mongoUser = { name: adminSession.username, role: "admin", email: "admin@typingmaster.local" };
    return next();
  }

  // 2. Otherwise verify Firebase ID token
  if (!isConfigured || !auth) {
    return res.status(503).json({
      error: "Authentication service unavailable — Firebase Admin credentials not configured on server",
    });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;

    // Verify admin role in MongoDB
    let dbUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!dbUser && decodedToken.email) {
      dbUser = await User.findOne({ email: decodedToken.email.toLowerCase() });
    }

    if (!dbUser || dbUser.role !== "admin") {
      return res.status(403).json({
        error: "Access Denied. Administrator role is required to access this endpoint.",
      });
    }

    if (dbUser.isBanned) {
      return res.status(403).json({
        error: "Admin account is banned.",
      });
    }

    req.mongoUser = dbUser;
    return next();
  } catch (err) {
    console.error("[auth] Admin check failed:", err.message);
    return res.status(401).json({
      error: "Invalid or expired authorization token",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

module.exports = { requireAuth, optionalAuth, requireAdmin };
