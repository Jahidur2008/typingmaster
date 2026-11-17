/**
 * Avro Phonetic input method converter: English phonetic typing to Bangla Unicode.
 * e.g., "ami" -> "আমি", "bangla" -> "বাংলা", "shikkha" -> "শিক্ষা", "dhonnobad" -> "ধন্যবাদ"
 */

// Vowels (Independent)
const VOWELS: Record<string, string> = {
  a: "আ",
  aa: "আ",
  o: "অ",
  i: "ই",
  ee: "ঈ",
  I: "ঈ",
  u: "উ",
  oo: "ঊ",
  U: "ঊ",
  e: "এ",
  E: "এ",
  oi: "ঐ",
  O: "ও",
  ou: "ঔ",
  au: "ঔ",
};

// Vowel signs (কার / Dependent Vowels)
const KAR_MAP: Record<string, string> = {
  a: "া",
  aa: "া",
  i: "ি",
  ee: "ী",
  I: "ী",
  u: "ু",
  oo: "ূ",
  U: "ূ",
  e: "ে",
  E: "ে",
  oi: "ৈ",
  o: "ো",
  O: "ো",
  ou: "ৌ",
  au: "ৌ",
};

// Common and complex conjuncts (যুক্তাক্ষর) - ordered by pattern length (longest first)
const CONJUNCTS: Record<string, string> = {
  kkhN: "ক্ষ্ণ",
  kkhm: "ক্ষম",
  kkh: "ক্ষ",
  kkhy: "ক্ষ্য",
  ggy: "জ্ঞ",
  jny: "জ্ঞ",
  Ngk: "ঙ্ক",
  Ngkh: "ঙ্খ",
  Ngg: "ঙ্গ",
  Nggh: "ঙ্ঘ",
  nch: "ঞ্ছ",
  nc: "ঞ্চ",
  njh: "ঞ্ঝ",
  nj: "ঞ্জ",
  NTh: "ণ্ঠ",
  NT: "ণ্ট",
  NDh: "ণ্ঢ",
  ND: "ণ্ড",
  NN: "ণ্ণ",
  Nm: "ণ্ম",
  nn: "ন্ন",
  kk: "ক্ক",
  gg: "গ্গ",
  pp: "প্প",
  ll: "ল্ল",
  ss: "স্স",
  tth: "ত্থ",
  tt: "ত্ত",
  ttr: "ত্ত্র",
  tmy: "ত্ম্য",
  tm: "ত্ম",
  tn: "ত্ন",
  tr: "ত্র",
  ddh: "দ্ধ",
  dd: "দ্দ",
  dgh: "দ্ঘ",
  dg: "দ্গ",
  db: "দ্ব",
  dbh: "দ্ভ",
  dm: "দ্ম",
  dy: "দ্য",
  ndh: "ন্ধ",
  nth: "ন্থ",
  nd: "ন্দ",
  nt: "ন্ত",
  ntr: "ন্ত্র",
  ndr: "ন্দ্র",
  ns: "ন্স",
  nsh: "ন্শ",
  nb: "ন্ব",
  nm: "ন্ম",
  ny: "ন্য",
  mpl: "মপ্ল",
  mbh: "ম্ভ",
  mph: "ম্ফ",
  mb: "ম্ব",
  mp: "ম্প",
  mn: "ম্ন",
  mm: "ম্ম",
  my: "ম্য",
  mr: "ম্র",
  ml: "ম্ল",
  bdh: "ব্ধ",
  bd: "ব্দ",
  bb: "ব্ব",
  bj: "ব্জ",
  bl: "ব্ল",
  by: "ব্য",
  br: "ব্র",
  kt: "ক্ত",
  ktr: "ক্ত্র",
  kl: "ক্ল",
  kw: "ক্ব",
  km: "ক্ম",
  ky: "ক্য",
  kr: "ক্র",
  ks: "ক্স",
  cch: "চ্ছ",
  cchr: "চ্ছ্র",
  cc: "চ্চ",
  jjh: "জ্ঝ",
  jj: "জ্জ",
  jw: "জ্ব",
  jy: "জ্য",
  jr: "জর",
  shch: "শ্ছ",
  shc: "শ্চ",
  shn: "শ্ন",
  shb: "শ্ব",
  shw: "শ্ব",
  shm: "শ্ম",
  shl: "শ্ল",
  shy: "শ্য",
  shr: "শ্র",
  ShTh: "ষ্ঠ",
  ShT: "ষ্ট",
  ShTr: "ষ্ট্র",
  Shk: "ষ্ক",
  Shkh: "ষ্খ",
  ShN: "ষ্ণ",
  Shp: "ষ্প",
  Shph: "ষ্ফ",
  Shm: "ষ্ম",
  Shy: "ষ্য",
  sth: "স্থ",
  str: "স্ত্র",
  st: "স্ত",
  sph: "স্ফ",
  sp: "স্প",
  spl: "স্প্ল",
  skh: "স্খ",
  sk: "স্ক",
  skr: "স্ক্র",
  sn: "স্ন",
  sm: "স্ম",
  sl: "স্ল",
  sw: "স্ব",
  sy: "স্য",
  sr: "স্র",
  hm: "হ্ম",
  hn: "হ্ন",
  hN: "হ্ণ",
  hl: "হ্ল",
  hb: "হ্ব",
  hw: "হ্ব",
  hr: "হ্র",
  hy: "হ্য",
  pr: "প্র",
  pl: "প্ল",
  ps: "প্স",
  pn: "প্ন",
  pt: "প্ত",
  py: "প্য",
  fr: "ফ্র",
  fl: "ফ্ল",
  gr: "গ্র",
  gl: "গ্ল",
  gn: "গ্ন",
  gm: "গম",
  gy: "গ্য",
  ghn: "ঘ্ন",
  ghr: "ঘ্র",
  dr: "দ্র",
  dhr: "ধ্র",
  dhn: "ধ্ন",
  dhm: "ধ্ম",
  dhy: "ধ্য",
  Tr: "ট্র",
  Dr: "ড্র",
};

// Consonants
const CONSONANTS: Record<string, string> = {
  kh: "খ",
  k: "ক",
  gh: "ঘ",
  g: "গ",
  Ng: "ঙ",
  ng: "ং",
  ch: "ছ",
  c: "চ",
  jh: "ঝ",
  j: "জ",
  NG: "ঞ",
  Th: "ঠ",
  T: "ট",
  Dh: "ঢ",
  D: "ড",
  N: "ণ",
  th: "থ",
  t: "ত",
  dh: "ধ",
  d: "দ",
  n: "ন",
  ph: "ফ",
  p: "প",
  f: "ফ",
  bh: "ভ",
  b: "ব",
  v: "ভ",
  m: "ম",
  z: "য",
  r: "র",
  l: "ল",
  sh: "শ",
  Sh: "ষ",
  S: "শ",
  s: "স",
  h: "হ",
  Rh: "ঢ়",
  R: "ড়",
  y: "য়",
  Y: "য়",
  w: "ওয়",
};

// Special symbols & punctuation
const SYMBOLS: Record<string, string> = {
  ":": "ঃ",
  "^": "ঁ",
  "`": "্",
  "t`": "ৎ",
  "r`": "ঋ",
  "R`": "ৃ",
  "$": "৳",
  ".": "।",
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

// Bangla Unicode ranges
const BANGLA_CONSONANTS_REGEX = /[\u0995-\u09B9\u09DC-\u09DF]/;
const BANGLA_KARS_REGEX = /[\u09BE-\u09CC\u09D7]/;

/**
 * Converts a phonetic English token/word into Bangla Unicode.
 * Handles vowels, consonants, kar diacritics, complex conjuncts (যুক্তাক্ষর),
 * and incremental typing (e.g. "আম" + "i" -> "আমি").
 */
export function avroPhoneticToken(input: string): string {
  if (!input) return "";

  // If the input is entirely Bangla characters already, return as is
  if (/^[\u0980-\u09FF\s]+$/.test(input)) {
    return input;
  }

  // Separate any existing Bangla prefix from trailing English letters
  // e.g. "আমi" -> prefix = "আম", asciiPart = "i"
  let prefix = "";
  let asciiPart = input;

  const match = input.match(/^([\u0980-\u09FF]+)(.*)$/);
  if (match) {
    prefix = match[1];
    asciiPart = match[2];
  }

  if (!asciiPart) return prefix;

  let result = prefix;
  let i = 0;
  const n = asciiPart.length;

  // Determine if previous character was a consonant
  let lastWasConsonant = false;
  if (prefix.length > 0) {
    const lastChar = prefix.slice(-1);
    if (BANGLA_CONSONANTS_REGEX.test(lastChar) && !BANGLA_KARS_REGEX.test(lastChar)) {
      lastWasConsonant = true;
    }
  }

  while (i < n) {
    const remaining = asciiPart.slice(i);

    // 1. Check special symbols first (e.g. t`, r`, :, $, numbers)
    if (remaining.startsWith("t`")) {
      result += "ৎ";
      i += 2;
      lastWasConsonant = false;
      continue;
    }
    if (remaining.startsWith("r`") || remaining.startsWith("R`")) {
      result += lastWasConsonant ? "ৃ" : "ঋ";
      i += 2;
      lastWasConsonant = false;
      continue;
    }
    const sym = SYMBOLS[asciiPart[i]];
    if (
      sym &&
      (asciiPart[i] === "$" ||
        asciiPart[i] === "^" ||
        asciiPart[i] === ":" ||
        asciiPart[i] === "`" ||
        (asciiPart[i] >= "0" && asciiPart[i] <= "9"))
    ) {
      result += sym;
      i++;
      lastWasConsonant = false;
      continue;
    }

    // 2. Ref (র্) check: "rr" or "r" before consonant
    if (
      (remaining.startsWith("rr") || (remaining.startsWith("r") && i > 0 && !lastWasConsonant)) &&
      remaining.length > 2
    ) {
      const offset = remaining.startsWith("rr") ? 2 : 1;
      const nextSub = remaining.slice(offset);
      const isNextConsonant = Object.keys(CONSONANTS).some((k) => nextSub.startsWith(k));
      if (isNextConsonant) {
        i += offset;
        result += "র্";
        continue;
      }
    }

    // 3. Check Vowel Signs (Kar) if previous was a consonant
    if (lastWasConsonant) {
      // Check multi-character vowels first (ee, oo, oi, ou, aa)
      let foundKar = false;
      for (const [vKey, kar] of Object.entries(KAR_MAP)) {
        if (remaining.startsWith(vKey)) {
          if (vKey === "o") {
            // Implicit vowel, advance without adding kar
            i += 1;
            lastWasConsonant = false;
            foundKar = true;
            break;
          }
          result += kar;
          i += vKey.length;
          lastWasConsonant = false;
          foundKar = true;
          break;
        }
      }
      if (foundKar) continue;

      // Check ja-phola (্য) via 'y' or 'z' after consonant
      if (remaining.startsWith("y") || remaining.startsWith("z")) {
        result += "্য";
        i++;
        lastWasConsonant = true;
        continue;
      }
      // Check ro-phola (্র) via 'r' after consonant
      if (remaining.startsWith("r")) {
        result += "্র";
        i++;
        lastWasConsonant = true;
        continue;
      }
      // Check ba-phola (্ব) via 'w' after consonant
      if (remaining.startsWith("w")) {
        result += "্ব";
        i++;
        lastWasConsonant = true;
        continue;
      }
    }

    // 4. Check Conjuncts (যুক্তাক্ষর)
    let conjunctMatched = false;
    for (const [pattern, conj] of Object.entries(CONJUNCTS)) {
      if (remaining.startsWith(pattern)) {
        result += conj;
        i += pattern.length;
        lastWasConsonant = true;
        conjunctMatched = true;
        break;
      }
    }
    if (conjunctMatched) continue;

    // 5. Check Independent Vowels (at word start or after vowel)
    if (!lastWasConsonant) {
      let foundVowel = false;
      for (const [vKey, vChar] of Object.entries(VOWELS)) {
        if (remaining.startsWith(vKey)) {
          result += vChar;
          i += vKey.length;
          lastWasConsonant = false;
          foundVowel = true;
          break;
        }
      }
      if (foundVowel) continue;
    }

    // 6. Check Single/Dual Consonants
    let consonantMatched = false;
    for (const [cKey, cChar] of Object.entries(CONSONANTS)) {
      if (remaining.startsWith(cKey)) {
        result += cChar;
        i += cKey.length;
        lastWasConsonant = true;
        consonantMatched = true;
        break;
      }
    }
    if (consonantMatched) continue;

    // 7. Fallback for unmapped characters (spaces, punctuation, etc.)
    result += asciiPart[i];
    lastWasConsonant = false;
    i++;
  }

  return result;
}

/**
 * Full Avro Phonetic converter for words or sentences.
 */
export function avroPhonetic(text: string): string {
  if (!text) return "";
  // If already Bangla, pass through
  if (/[\u0980-\u09FF]/.test(text)) return text;

  // Split by whitespace so each token converts independently while preserving spaces
  return text
    .split(/(\s+)/)
    .map((chunk) => (/^\s+$/.test(chunk) ? chunk : avroPhoneticToken(chunk)))
    .join("");
}
