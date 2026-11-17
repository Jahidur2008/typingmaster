/**
 * Firebase Admin SDK configuration (v14 modular).
 *
 * Automatically detects service account credentials from:
 *  1. Path in GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY
 *  2. serviceAccountKey.json located in server/ or project directory
 *  3. Raw service account JSON string via FIREBASE_SERVICE_ACCOUNT
 *  4. Individual environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

const path = require("path");
const fs = require("fs");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let app = null;
let auth = null;
let isConfigured = false;

function initFirebase() {
  if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    return { app, auth, isConfigured: true };
  }

  // 1. Check candidate paths for serviceAccountKey.json
  const candidatePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    path.join(__dirname, "..", "serviceAccountKey.json"),
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "server", "serviceAccountKey.json"),
  ].filter(Boolean);

  for (const p of candidatePaths) {
    const resolved = path.isAbsolute(p) ? p : path.resolve(__dirname, "..", p);
    if (fs.existsSync(resolved)) {
      try {
        app = initializeApp({
          credential: cert(resolved),
        });
        auth = getAuth(app);
        isConfigured = true;
        console.log(`[firebase-admin] Initialized from file: ${resolved}`);
        return { app, auth, isConfigured };
      } catch (err) {
        console.warn(`[firebase-admin] Failed to load credentials from "${resolved}": ${err.message}`);
      }
    }
  }

  // 2. Full JSON string in env
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = initializeApp({
        credential: cert(parsed),
      });
      auth = getAuth(app);
      isConfigured = true;
      console.log("[firebase-admin] Initialized from FIREBASE_SERVICE_ACCOUNT env var");
      return { app, auth, isConfigured };
    } catch (err) {
      console.warn(`[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${err.message}`);
    }
  }

  // 3. Individual fields in env
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      privateKey = privateKey.replace(/\\n/g, "\n");
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      auth = getAuth(app);
      isConfigured = true;
      console.log(`[firebase-admin] Initialized for project: ${projectId}`);
      return { app, auth, isConfigured };
    } catch (err) {
      console.warn(`[firebase-admin] Failed to initialize with env variables: ${err.message}`);
    }
  }

  // 4. Fallback to public ID token verification with projectId only
  try {
    const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || "typing-master-34cd2";
    app = initializeApp({ projectId: fallbackProjectId }, "typing-master-default");
    auth = getAuth(app);
    isConfigured = true;
    console.log(`[firebase-admin] Initialized fallback auth for project: ${fallbackProjectId}`);
    return { app, auth, isConfigured };
  } catch (err) {
    console.warn(`[firebase-admin] Fallback initialization failed: ${err.message}`);
  }

  return { app: null, auth: null, isConfigured: false };
}

const firebaseInstance = initFirebase();

module.exports = firebaseInstance;
