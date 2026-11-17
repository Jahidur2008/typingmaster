import englishData from "@/client/data/english-words.json";
import banglaData from "@/client/data/bangla-words.json";
import quotesData from "@/client/data/quotes.json";

/* ------------------------------------------------------------------ */
/*  Data access layer                                                  */
/*                                                                     */
/*  Today: bundled JSON from client/data/. Tomorrow: the functions     */
/*  below are the single swap point for a database — keep the same     */
/*  signatures (ideally async) and nothing else in the app changes.    */
/* ------------------------------------------------------------------ */

export type Language = "english" | "bangla";
export type QuoteLength = "short" | "medium" | "long";

export interface Quote {
  id: string;
  language: Language;
  source: string;
  text: string;
  length: QuoteLength;
}

const WORD_LISTS: Record<Language, readonly string[]> = {
  english: englishData.words as string[],
  bangla: banglaData.words as string[],
};

const QUOTES: Quote[] = (quotesData.quotes as Quote[]).filter((q) =>
  (["short", "medium", "long"] as string[]).includes(q.length),
);

export function getWordList(language: Language): readonly string[] {
  return WORD_LISTS[language];
}

export function getQuotes(language: Language): Quote[] {
  return QUOTES.filter((q) => q.language === language);
}

/** Random quote of the requested length, or null when none exist yet. */
export function pickQuote(language: Language, length: QuoteLength): Quote | null {
  const pool = QUOTES.filter((q) => q.language === language && q.length === length);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
