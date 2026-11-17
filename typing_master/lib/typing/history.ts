import type { TypingResults, WpmSample } from "./engine";
import type { TypingConfig } from "./config";

export interface SavedResult {
  _id?: string;
  id?: string;
  mode: string;
  duration?: number;
  wordCount?: number;
  quoteLength?: string;
  language: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  chars: {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
  };
  wpmPerSecond: WpmSample[];
  createdAt: string;
  xpEarned?: number;
}

const GUEST_STORAGE_KEY = "tm-guest-history";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Loads guest results stored locally in the browser.
 */
export function getGuestResults(): SavedResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedResult[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a guest result in localStorage (kept up to 100 entries).
 */
export function saveGuestResult(
  results: TypingResults,
  config: TypingConfig,
): SavedResult {
  const item: SavedResult = {
    id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    mode: config.mode,
    duration: config.mode === "time" ? config.timeSeconds : Math.round(results.timeMs / 1000),
    wordCount: config.mode === "words" ? config.wordCount : undefined,
    quoteLength: config.mode === "quote" ? config.quoteLength : undefined,
    language: config.language,
    wpm: Math.round(results.wpm * 10) / 10,
    rawWpm: Math.round(results.rawWpm * 10) / 10,
    accuracy: Math.round(results.accuracy * 10) / 10,
    consistency: Math.round(results.consistency * 10) / 10,
    chars: results.chars,
    wpmPerSecond: results.history,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getGuestResults();
      const updated = [item, ...existing].slice(0, 100);
      window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("[history] Failed to persist guest result to localStorage:", e);
    }
  }

  return item;
}

/**
 * Submits typing test result to the backend server.
 */
export async function submitResultToBackend(
  results: TypingResults,
  config: TypingConfig,
  token: string,
): Promise<{
  result: SavedResult;
  newPB: boolean;
  xpEarned: number;
  newBadges?: Array<{ name: string; slug: string; icon?: string; xpReward: number; description?: string }>;
  user?: { xp: number; level: number; leveledUp: boolean; streak?: { current: number; best: number } };
}> {
  const payload = {
    mode: config.mode,
    duration: config.mode === "time" ? config.timeSeconds : Math.round(results.timeMs / 1000),
    wordCount: config.mode === "words" ? config.wordCount : undefined,
    quoteLength: config.mode === "quote" ? config.quoteLength : undefined,
    language: config.language,
    wpm: results.wpm,
    rawWpm: results.rawWpm,
    accuracy: results.accuracy,
    consistency: results.consistency,
    chars: results.chars,
    wpmPerSecond: results.history,
  };

  const res = await fetch(`${API_URL}/api/results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${res.status}`);
  }

  return res.json();
}

/**
 * Submits a challenge attempt to the backend server.
 */
export async function submitChallengeAttempt(
  challengeId: string,
  payload: { wpm: number; accuracy: number; timeSeconds: number },
  token?: string | null,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/challenges/${challengeId}/attempt`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server responded with ${res.status}`);
  }

  return res.json();
}
