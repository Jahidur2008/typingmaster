/**
 * Bijoy Keyboard Layout Converter for Bangla typing.
 * Maps standard QWERTY physical key combinations into Bijoy Bangla Unicode.
 * Supports:
 *  - Unshifted and Shifted key character mappings
 *  - Link key 'g' / 'G' for hasanta and standalone vowel formation (g+f -> আ, g+d -> ই, etc.)
 *  - Conjuncts (যুক্তবর্ণ) formed via consonant + g + consonant
 *  - Phola and Ref modifiers (z -> ্র, Z -> ্য, A -> র্)
 */

// Base Bijoy key mappings (QWERTY key -> Bangla character)
export const BIJOY_KEY_MAP: Record<string, string> = {
  // Lowercase / Unshifted
  q: "ঙ",
  w: "য",
  e: "ড",
  r: "প",
  t: "ট",
  y: "চ",
  u: "জ",
  i: "হ",
  o: "গ",
  p: "ড়",
  a: "ৃ",
  s: "ু",
  d: "ি",
  f: "া",
  g: "্",
  h: "ব",
  j: "ক",
  k: "ত",
  l: "দ",
  z: "্র",
  x: "ও",
  c: "ে",
  v: "র",
  b: "ন",
  n: "স",
  m: "ম",
  "`": "`",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
  "0": "০",
  "-": "-",
  "=": "=",
  "[": "[",
  "]": "]",
  "\\": "\\",
  ";": ";",
  "'": "'",
  ",": ",",
  ".": "।",
  "/": "/",

  // Uppercase / Shifted
  Q: "ং",
  W: "য়",
  E: "ঢ",
  R: "ফ",
  T: "ঠ",
  Y: "ছ",
  U: "ঝ",
  I: "ঞ",
  O: "ঘ",
  P: "ঢ়",
  A: "র্",
  S: "ূ",
  D: "ী",
  F: "অ",
  G: "্",
  H: "ভ",
  J: "খ",
  K: "থ",
  L: "ধ",
  Z: "্য",
  X: "ৌ",
  C: "ৈ",
  V: "ল",
  B: "ণ",
  N: "ষ",
  M: "শ",
  "~": "~",
  "!": "!",
  "@": "@",
  "#": "#",
  $: "৳",
  "%": "%",
  "^": "^",
  "&": "&",
  "*": "*",
  "(": "(",
  ")": ")",
  _: "_",
  "+": "+",
  "{": "{",
  "}": "}",
  "|": "|",
  ":": ":",
  '"': '"',
  "<": "<",
  ">": ">",
  "?": "?",
};

// Independent vowels produced by pressing link key 'g' followed by key
const LINK_VOWELS: Record<string, string> = {
  f: "আ",
  d: "ই",
  D: "ঈ",
  s: "উ",
  S: "ঊ",
  a: "ঋ",
  c: "এ",
  C: "ঐ",
  x: "ও",
  X: "ঔ",
};

/**
 * Converts a sequence of raw keystrokes typed under Bijoy layout into
 * standard Bangla Unicode.
 */
export function bijoyConvert(rawText: string): string {
  if (!rawText) return "";

  // If already full Bangla, pass through
  if (/[\u0980-\u09FF]/.test(rawText)) {
    return rawText;
  }

  let result = "";
  let i = 0;
  const n = rawText.length;

  while (i < n) {
    const ch = rawText[i];

    // Check link key 'g' or 'G' (hasanta / vowel builder)
    if (ch === "g" || ch === "G") {
      const next = rawText[i + 1];
      // Standalone vowel: g + f -> আ, g + d -> ই, etc.
      if (next && LINK_VOWELS[next]) {
        // If previous character was not a consonant, or at beginning, forms vowel
        const prev = result.slice(-1);
        const isPrevConsonant = /[\u0995-\u09B9\u09DC-\u09DF]/.test(prev);

        if (!isPrevConsonant || result.length === 0) {
          result += LINK_VOWELS[next];
          i += 2;
          continue;
        }
      }

      // Link key between consonants forms conjunct hasanta (্)
      result += "্";
      i++;
      continue;
    }

    // Direct mapped key
    if (BIJOY_KEY_MAP[ch]) {
      result += BIJOY_KEY_MAP[ch];
      i++;
      continue;
    }

    // Fallback for unmapped chars (spaces, unknown punctuation)
    result += ch;
    i++;
  }

  return result;
}
