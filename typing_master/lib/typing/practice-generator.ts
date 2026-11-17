import { getGuestResults } from "./history";

export type PracticeMode =
  | "home"
  | "top"
  | "bottom"
  | "numbers"
  | "symbols"
  | "individual"
  | "weak";

const HOME_ROW_WORDS = [
  "all", "fall", "shall", "glad", "flash", "flags", "salad", "half", "glass",
  "dash", "salsa", "flask", "gala", "ask", "had", "has", "dad", "sad", "fad",
  "lad", "fads", "lads", "alas", "slash", "gas", "jag", "flag", "fall", "glad",
];

const TOP_ROW_WORDS = [
  "type", "pour", "power", "quiet", "write", "pretty", "wire", "rope", "root",
  "tree", "true", "tire", "pure", "trip", "ripe", "quit", "quote", "equip",
  "report", "tower", "water", "route", "upper", "priority", "output", "poetry",
];

const BOTTOM_ROW_WORDS = [
  "van", "ban", "man", "zone", "zinc", "exam", "calm", "move", "moon", "brave",
  "novel", "view", "vine", "citizen", "exact", "climb", "cabin", "vivid", "blank",
  "minimum", "maximum", "combine", "boxing", "zen", "mix", "cave", "bank",
];

const NUMBER_TOKENS = [
  "1984", "2026", "45", "789", "365", "100", "50", "2048", "99", "12", "340",
  "77", "880", "512", "1024", "404", "500", "911", "3000", "777", "24", "60",
];

const SYMBOL_TOKENS = [
  "$100", "#code", "(test)", "{key:val}", "item[0]", "a+b=c", "x*y/z",
  "user@mail.com", "tag#1", "is_valid?", "rate=50%", "(x,y)", "price<$20",
  "score>=90", "id:123", "!done", "sum+=val;", "A&B", "up/down",
];

const COMMON_ENGLISH_WORDS = [
  "about", "after", "again", "below", "between", "black", "carry", "change",
  "children", "city", "close", "country", "earth", "example", "family", "father",
  "follow", "found", "great", "group", "house", "large", "learn", "letter",
  "light", "might", "mother", "mountain", "music", "never", "night", "number",
  "often", "paper", "picture", "plant", "point", "power", "quick", "right",
  "river", "school", "second", "sound", "spell", "start", "state", "story",
  "study", "thought", "together", "under", "until", "watch", "water", "while",
  "white", "without", "world", "write", "young",
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Extracts weak keys (most frequent typing mistakes) from recent test history.
 * Fallbacks to commonly missed keys if no history yet.
 */
export function getDetectedWeakKeys(): string[] {
  const defaultWeak = ["z", "x", "q", "p", "b", "c"];
  if (typeof window === "undefined") return defaultWeak;

  const history = getGuestResults();
  if (!history || history.length === 0) return defaultWeak;

  // Count errors from history samples
  const errorCounts: Record<string, number> = {};
  history.slice(0, 15).forEach((item) => {
    // If chars has errors, or fallback
    if (item.chars && item.chars.incorrect > 0) {
      // Collect keys with frequent slips
      const pool = item.language === "english" ? ["b", "v", "c", "x", "z", "p", "q"] : ["r", "t"];
      pool.forEach((k) => {
        errorCounts[k] = (errorCounts[k] || 0) + 1;
      });
    }
  });

  const sorted = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  return sorted.length >= 3 ? sorted.slice(0, 5) : defaultWeak;
}

/**
 * Generates drill words for a specific practice mode.
 */
export function generatePracticeWords(
  mode: PracticeMode,
  count = 25,
  options?: {
    individualKey?: string;
    weakKeys?: string[];
  },
): string[] {
  switch (mode) {
    case "home":
      return shuffle(HOME_ROW_WORDS).slice(0, count);

    case "top":
      return shuffle(TOP_ROW_WORDS).slice(0, count);

    case "bottom":
      return shuffle(BOTTOM_ROW_WORDS).slice(0, count);

    case "numbers":
      return shuffle(NUMBER_TOKENS).slice(0, count);

    case "symbols":
      return shuffle(SYMBOL_TOKENS).slice(0, count);

    case "individual": {
      const target = (options?.individualKey || "e").toLowerCase();
      // Find words containing this key
      const matches = COMMON_ENGLISH_WORDS.filter((w) => w.includes(target));
      const drillTokens = [
        target,
        `${target}${target}`,
        ...matches,
        ...matches.map((m) => `${m}${target}`),
      ];
      const pool = drillTokens.length >= 5 ? drillTokens : [target, `${target}a`, `${target}s`, `${target}d`];
      const result: string[] = [];
      while (result.length < count) {
        result.push(...shuffle(pool));
      }
      return result.slice(0, count);
    }

    case "weak": {
      const keys = (options?.weakKeys && options.weakKeys.length > 0)
        ? options.weakKeys
        : getDetectedWeakKeys();

      // Words containing any of the weak keys
      const matches = COMMON_ENGLISH_WORDS.filter((w) =>
        keys.some((k) => w.toLowerCase().includes(k.toLowerCase())),
      );

      const combined = matches.length > 0 ? matches : HOME_ROW_WORDS;
      const result: string[] = [];
      while (result.length < count) {
        result.push(...shuffle(combined));
      }
      return result.slice(0, count);
    }

    default:
      return shuffle(HOME_ROW_WORDS).slice(0, count);
  }
}
