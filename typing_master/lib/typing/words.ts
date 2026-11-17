import { getWordList, type Language } from "./data";

/* ------------------------------------------------------------------ */
/*  Word generation + modifiers for the typing test                    */
/* ------------------------------------------------------------------ */

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random test words from the language pool, avoiding immediate repeats. */
export function generateWords(language: Language, count: number): string[] {
  const list = getWordList(language);
  const out: string[] = [];
  let pool: string[] = [];
  while (out.length < count) {
    if (pool.length === 0) pool = shuffle(list as string[]);
    const next = pool.pop() as string;
    if (out.length > 0 && next === out[out.length - 1] && pool.length > 0) {
      const alt = pool.pop() as string;
      pool.push(next);
      out.push(alt);
    } else {
      out.push(next);
    }
  }
  return out;
}

/**
 * Sprinkle punctuation over a word stream: sentence capitalization,
 * commas, periods, occasional question/exclamation marks and quotes.
 * (Bangla has no letter case, so capitalization is a no-op there.)
 */
export function applyPunctuation(words: string[]): string[] {
  const out: string[] = [];
  let startOfSentence = true;
  for (let i = 0; i < words.length; i++) {
    let word = words[i] as string;
    if (startOfSentence && /^[a-z]/.test(word)) {
      word = word[0].toUpperCase() + word.slice(1);
    }
    startOfSentence = false;
    if (i === words.length - 1) {
      out.push(`${word}.`);
      break;
    }
    const r = Math.random();
    if (r < 0.1) out.push(`${word},`);
    else if (r < 0.125) {
      out.push(`${word}?`);
      startOfSentence = true;
    } else if (r < 0.15) {
      out.push(`${word}!`);
      startOfSentence = true;
    } else if (r < 0.2) {
      out.push(`${word}.`);
      startOfSentence = true;
    } else if (r < 0.24) out.push(`"${word}"`);
    else out.push(word);
  }
  return out;
}

/** Replace a slice of words with random numbers (some with % signs). */
export function applyNumbers(words: string[]): string[] {
  return words.map((word, i) => {
    if (i > 0 && Math.random() < 0.08) {
      const n = 1 + Math.floor(Math.random() * 9999);
      return Math.random() < 0.15 ? `${n}%` : String(n);
    }
    return word;
  });
}
