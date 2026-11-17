/**
 * Unified API URL resolver.
 * Priority:
 * 1. Explicit process.env.NEXT_PUBLIC_API_URL
 * 2. If running in browser and NOT localhost -> Live Render Backend
 * 3. Fallback to localhost:4000 for local dev
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && !window.location.hostname.includes("127.0.0.1")
    ? "https://typing-master-api.onrender.com"
    : "http://localhost:4000");
