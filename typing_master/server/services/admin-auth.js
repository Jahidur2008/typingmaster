const crypto = require("crypto");

function getSecret() {
  return process.env.ADMIN_SECRET_KEY || "typing_master_super_secret_admin_key_2026_xyz987";
}

function getAdminCredentials() {
  return {
    username: (process.env.ADMIN_USERNAME || "admin").trim(),
    password: (process.env.ADMIN_PASSWORD || "admin123").trim(),
  };
}

/**
 * Generates a signed admin session token valid for 7 days
 */
function generateAdminToken(username) {
  const payload = {
    username,
    role: "admin",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(serialized).digest("base64url");
  return `adm_${serialized}.${signature}`;
}

/**
 * Verifies the signed admin session token
 */
function verifyAdminToken(token) {
  if (!token || !token.startsWith("adm_")) return null;
  const raw = token.slice(4);
  const parts = raw.split(".");
  if (parts.length !== 2) return null;

  const [serialized, signature] = parts;
  const expectedSig = crypto.createHmac("sha256", getSecret()).update(serialized).digest("base64url");

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(serialized, "base64url").toString("utf8"));
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  getAdminCredentials,
  generateAdminToken,
  verifyAdminToken,
};
