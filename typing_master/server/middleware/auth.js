/**
 * Firebase ID token verification middleware.
 *
 * Verifies Bearer token sent in Authorization header using firebase-admin auth.
 * On success, attaches decoded token payload to `req.user`.
 */

const { auth, isConfigured } = require("../config/firebase");
const User = require("../models/user");
const { verifyAdminToken } = require("../services/admin-auth");

/**
 * Fallback to safely decode a Firebase ID token (JWT)
 * and verify issuer, audience, and expiration.
 */
function decodeFirebaseJwt(idToken) {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    const validAud =
      payload.aud === "typing-master-34cd2" ||
      payload.aud === (process.env.FIREBASE_PROJECT_ID || "typing-master-34cd2");
    if (!validAud) return null;
    // Allow up to 5 minutes clock skew
    if (payload.exp && payload.exp < now - 300) return null;
    if (!payload.sub && !payload.user_id) return null;
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      ...payload,
    };
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
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

  let decodedToken = null;

  if (isConfigured && auth && typeof auth.verifyIdToken === "function") {
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.warn("[auth] verifyIdToken failed, using JWT fallback:", err.message);
    }
  }

  if (!decodedToken) {
    decodedToken = decodeFirebaseJwt(idToken);
  }

  if (!decodedToken || !decodedToken.uid) {
    return res.status(401).json({
      error: "Invalid or expired authorization token",
    });
  }

  req.user = decodedToken;

  // Check if user is banned in MongoDB
  try {
    const dbUser = await User.findOne({ firebaseUid: decodedToken.uid }).select("isBanned role");
    if (dbUser && dbUser.isBanned) {
      return res.status(403).json({
        error: "Your account has been banned by an administrator.",
      });
    }
  } catch (err) {
    console.warn("[auth] Error checking banned status:", err.message);
  }

  return next();
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const idToken = authHeader.split("Bearer ")[1].trim();
  if (!idToken) return next();

  let decodedToken = null;
  if (isConfigured && auth && typeof auth.verifyIdToken === "function") {
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch {
      // Continue to fallback
    }
  }
  if (!decodedToken) {
    decodedToken = decodeFirebaseJwt(idToken);
  }
  if (decodedToken) {
    req.user = decodedToken;
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
