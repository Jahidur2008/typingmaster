export interface LeaderboardUser {
  _id: string;
  firebaseUid?: string;
  name: string;
  photo?: string;
  country?: string;
  level?: number;
}

export interface LeaderboardEntry {
  _id: string;
  bestResultId: string;
  rank: number;
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  mode: string;
  duration?: number;
  wordCount?: number;
  language: string;
  createdAt: string;
  user: LeaderboardUser;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  currentUserRank: {
    rank: number;
    wpm: number;
    accuracy: number;
    createdAt: string;
    isInTopList: boolean;
  } | null;
  filters: {
    timeframe: string;
    language: string;
    mode: string;
    modeConfig: string;
    country: string;
  };
}

/**
 * Returns country flag emoji from 2-letter ISO code
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return "🌐";
  const code = countryCode.trim().toUpperCase();
  if (code.length === 2) {
    const codePoints = [...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  }
  // Common fallbacks
  if (code.includes("BANGLA") || code === "BD") return "🇧🇩";
  if (code.includes("UNITED STATES") || code === "USA" || code === "US") return "🇺🇸";
  if (code.includes("UNITED KINGDOM") || code === "UK" || code === "GB") return "🇬🇧";
  if (code.includes("INDIA") || code === "IN") return "🇮🇳";
  if (code.includes("CANADA") || code === "CA") return "🇨🇦";
  if (code.includes("GERMANY") || code === "DE") return "🇩🇪";
  if (code.includes("JAPAN") || code === "JP") return "🇯🇵";
  if (code.includes("AUSTRALIA") || code === "AU") return "🇦🇺";
  return "🌐";
}

/**
 * Country name lookup helper
 */
export const COUNTRY_NAMES: Record<string, string> = {
  BD: "Bangladesh",
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  CA: "Canada",
  DE: "Germany",
  JP: "Japan",
  AU: "Australia",
  FR: "France",
  BR: "Brazil",
  PK: "Pakistan",
};
