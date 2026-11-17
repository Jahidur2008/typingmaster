import type { TypingConfig } from "./config";

/* ------------------------------------------------------------------ */
/*  Personal bests (localStorage for now; swap for a DB later).        */
/* ------------------------------------------------------------------ */

export interface PersonalBest {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  label: string;
  /** ISO date of the record. */
  date: string;
}

export type PersonalBests = Record<string, PersonalBest>;

const STORAGE_KEY = "tm-personal-bests";

/** Human-readable name of the current test type, e.g. "time 30s · english". */
export function testTypeLabel(config: TypingConfig): string {
  const lang = config.language === "bangla" ? "বাংলা" : "english";
  switch (config.mode) {
    case "time":
      return `time ${config.timeSeconds}s · ${lang}`;
    case "words":
      return `words ${config.wordCount} · ${lang}`;
    case "quote":
      return `quote ${config.quoteLength} · ${lang}`;
    case "custom":
      return `custom · ${config.customText.trim().split(/\s+/).length} words`;
    case "zen":
      return "zen";
    case "random":
      return `random · ${lang}`;
    default:
      return "test";
  }
}

/** Storage key for one test type (mode + language + length variant). */
export function pbKey(config: TypingConfig): string {
  const variant =
    config.mode === "time"
      ? config.timeSeconds
      : config.mode === "words"
        ? config.wordCount
        : config.mode === "quote"
          ? config.quoteLength
          : config.mode === "custom"
            ? `c${config.customText.length}`
            : "free";
  return `${config.mode}:${config.language}:${variant}`;
}

export function loadPersonalBests(): PersonalBests {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersonalBests) : {};
  } catch {
    return {};
  }
}

export function savePersonalBests(bests: PersonalBests): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bests));
  } catch {
    // storage unavailable — ignore
  }
}

/** Returns true (and saves the new record) when `wpm` beats the stored best. */
export function recordResult(
  config: TypingConfig,
  result: { wpm: number; rawWpm: number; accuracy: number },
): boolean {
  const key = pbKey(config);
  const bests = loadPersonalBests();
  const prev = bests[key];
  if (prev && result.wpm <= prev.wpm) return false;
  bests[key] = {
    wpm: result.wpm,
    rawWpm: result.rawWpm,
    accuracy: result.accuracy,
    label: testTypeLabel(config),
    date: new Date().toISOString(),
  };
  savePersonalBests(bests);
  return true;
}

/** Best WPM for a test type, or null when none recorded yet. */
export function getBestWpm(config: TypingConfig): number | null {
  return loadPersonalBests()[pbKey(config)]?.wpm ?? null;
}
