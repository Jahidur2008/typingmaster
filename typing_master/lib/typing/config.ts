import type { Language, QuoteLength } from "./data";

/* ------------------------------------------------------------------ */
/*  Test configuration — shared by the config bar, the hook and UI.    */
/* ------------------------------------------------------------------ */

export type TestMode = "time" | "words" | "quote" | "custom" | "zen" | "random";

export interface TypingConfig {
  language: Language;
  mode: TestMode;
  /** Time mode length in seconds. */
  timeSeconds: number;
  /** Words mode length. */
  wordCount: number;
  /** Quote mode length bucket. */
  quoteLength: QuoteLength;
  punctuation: boolean;
  numbers: boolean;
  /** Custom mode source text. */
  customText: string;
}

export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;
export const QUOTE_LENGTH_OPTIONS = ["short", "medium", "long"] as const;

export const TEST_MODES: TestMode[] = [
  "time",
  "words",
  "quote",
  "custom",
  "zen",
  "random",
];

export const DEFAULT_CONFIG: TypingConfig = {
  language: "english",
  mode: "time",
  timeSeconds: 30,
  wordCount: 25,
  quoteLength: "medium",
  punctuation: false,
  numbers: false,
  customText: "",
};

const STORAGE_KEY = "tm-config";

/** Coerce arbitrary parsed JSON into a valid TypingConfig. */
function sanitize(input: Partial<TypingConfig> | null): TypingConfig {
  const c = { ...DEFAULT_CONFIG, ...(input ?? {}) };
  if (!TEST_MODES.includes(c.mode)) c.mode = DEFAULT_CONFIG.mode;
  if (!TIME_OPTIONS.includes(c.timeSeconds as (typeof TIME_OPTIONS)[number])) {
    c.timeSeconds = DEFAULT_CONFIG.timeSeconds;
  }
  if (!WORD_OPTIONS.includes(c.wordCount as (typeof WORD_OPTIONS)[number])) {
    c.wordCount = DEFAULT_CONFIG.wordCount;
  }
  if (!QUOTE_LENGTH_OPTIONS.includes(c.quoteLength)) {
    c.quoteLength = DEFAULT_CONFIG.quoteLength;
  }
  if (c.language !== "english" && c.language !== "bangla") {
    c.language = DEFAULT_CONFIG.language;
  }
  if (typeof c.customText !== "string") c.customText = "";
  return c;
}

/** Read the persisted config. Client-only; falls back to defaults. */
export function loadConfig(): TypingConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return sanitize(JSON.parse(raw) as Partial<TypingConfig>);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: TypingConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // storage unavailable (private mode etc.) — ignore
  }
}
