/**
 * On-screen keyboard layouts, keyed by physical key position so live
 * keypress highlighting works with `KeyboardEvent.code` regardless of
 * the actual character produced.
 *
 * The Bangla layouts (Avro phonetic, Bijoy legacy) are approximate
 * illustrations of the real layouts.
 */

import type { KeyboardLayoutId } from "@/lib/store/settings";

export interface KeyDef {
  /** Character shown on the key. */
  label: string;
  /** KeyboardEvent.code of the physical key (for press highlighting). */
  code: string;
  /** Width in key units (default 1). */
  w?: number;
}

export interface KeyboardLayout {
  name: string;
  note?: string;
  rows: KeyDef[][];
}

const SHIFT: KeyDef = { label: "⇧ Shift", code: "ShiftLeft", w: 2.4 };

const DIGITS: KeyDef[] = [
  { label: "`", code: "Backquote" },
  { label: "1", code: "Digit1" },
  { label: "2", code: "Digit2" },
  { label: "3", code: "Digit3" },
  { label: "4", code: "Digit4" },
  { label: "5", code: "Digit5" },
  { label: "6", code: "Digit6" },
  { label: "7", code: "Digit7" },
  { label: "8", code: "Digit8" },
  { label: "9", code: "Digit9" },
  { label: "0", code: "Digit0" },
  { label: "-", code: "Minus" },
  { label: "=", code: "Equal" },
  { label: "⌫", code: "Backspace", w: 2 },
];

const QWERTY: KeyDef[][] = [
  DIGITS,
  [
    { label: "q", code: "KeyQ" },
    { label: "w", code: "KeyW" },
    { label: "e", code: "KeyE" },
    { label: "r", code: "KeyR" },
    { label: "t", code: "KeyT" },
    { label: "y", code: "KeyY" },
    { label: "u", code: "KeyU" },
    { label: "i", code: "KeyI" },
    { label: "o", code: "KeyO" },
    { label: "p", code: "KeyP" },
    { label: "[", code: "BracketLeft" },
    { label: "]", code: "BracketRight" },
    { label: "\\", code: "Backslash", w: 1.4 },
  ],
  [
    { label: "a", code: "KeyA", w: 1.4 },
    { label: "s", code: "KeyS" },
    { label: "d", code: "KeyD" },
    { label: "f", code: "KeyF" },
    { label: "g", code: "KeyG" },
    { label: "h", code: "KeyH" },
    { label: "j", code: "KeyJ" },
    { label: "k", code: "KeyK" },
    { label: "l", code: "KeyL" },
    { label: ";", code: "Semicolon" },
    { label: "'", code: "Quote" },
    { label: "Enter ⏎", code: "Enter", w: 2 },
  ],
  [
    SHIFT,
    { label: "z", code: "KeyZ" },
    { label: "x", code: "KeyX" },
    { label: "c", code: "KeyC" },
    { label: "v", code: "KeyV" },
    { label: "b", code: "KeyB" },
    { label: "n", code: "KeyN" },
    { label: "m", code: "KeyM" },
    { label: ",", code: "Comma" },
    { label: ".", code: "Period" },
    { label: "/", code: "Slash" },
    { label: "⇧ Shift", code: "ShiftRight", w: 2.4 },
  ],
  [{ label: "Space", code: "Space", w: 8 }],
];

const DVORAK: KeyDef[][] = [
  DIGITS,
  [
    { label: "'", code: "KeyQ" },
    { label: ",", code: "KeyW" },
    { label: ".", code: "KeyE" },
    { label: "p", code: "KeyR" },
    { label: "y", code: "KeyT" },
    { label: "f", code: "KeyY" },
    { label: "g", code: "KeyU" },
    { label: "c", code: "KeyI" },
    { label: "r", code: "KeyO" },
    { label: "l", code: "KeyP" },
    { label: "/", code: "BracketLeft" },
    { label: "=", code: "BracketRight" },
    { label: "\\", code: "Backslash", w: 1.4 },
  ],
  [
    { label: "a", code: "KeyA", w: 1.4 },
    { label: "o", code: "KeyS" },
    { label: "e", code: "KeyD" },
    { label: "u", code: "KeyF" },
    { label: "i", code: "KeyG" },
    { label: "d", code: "KeyH" },
    { label: "h", code: "KeyJ" },
    { label: "t", code: "KeyK" },
    { label: "n", code: "KeyL" },
    { label: "s", code: "Semicolon" },
    { label: "-", code: "Quote" },
    { label: "Enter ⏎", code: "Enter", w: 2 },
  ],
  [
    SHIFT,
    { label: ";", code: "KeyZ" },
    { label: "q", code: "KeyX" },
    { label: "j", code: "KeyC" },
    { label: "k", code: "KeyV" },
    { label: "x", code: "KeyB" },
    { label: "b", code: "KeyN" },
    { label: "m", code: "KeyM" },
    { label: "w", code: "Comma" },
    { label: "v", code: "Period" },
    { label: "z", code: "Slash" },
    { label: "⇧ Shift", code: "ShiftRight", w: 2.4 },
  ],
  [{ label: "Space", code: "Space", w: 8 }],
];

const COLEMAK: KeyDef[][] = [
  DIGITS,
  [
    { label: "q", code: "KeyQ" },
    { label: "w", code: "KeyW" },
    { label: "f", code: "KeyE" },
    { label: "p", code: "KeyR" },
    { label: "g", code: "KeyT" },
    { label: "j", code: "KeyY" },
    { label: "l", code: "KeyU" },
    { label: "u", code: "KeyI" },
    { label: "y", code: "KeyO" },
    { label: ";", code: "KeyP" },
    { label: "[", code: "BracketLeft" },
    { label: "]", code: "BracketRight" },
    { label: "\\", code: "Backslash", w: 1.4 },
  ],
  [
    { label: "a", code: "KeyA", w: 1.4 },
    { label: "r", code: "KeyS" },
    { label: "s", code: "KeyD" },
    { label: "t", code: "KeyF" },
    { label: "d", code: "KeyG" },
    { label: "h", code: "KeyH" },
    { label: "n", code: "KeyJ" },
    { label: "e", code: "KeyK" },
    { label: "i", code: "KeyL" },
    { label: "o", code: "Semicolon" },
    { label: "'", code: "Quote" },
    { label: "Enter ⏎", code: "Enter", w: 2 },
  ],
  [
    SHIFT,
    { label: "z", code: "KeyZ" },
    { label: "x", code: "KeyX" },
    { label: "c", code: "KeyC" },
    { label: "v", code: "KeyV" },
    { label: "b", code: "KeyB" },
    { label: "k", code: "KeyN" },
    { label: "m", code: "KeyM" },
    { label: ",", code: "Comma" },
    { label: ".", code: "Period" },
    { label: "/", code: "Slash" },
    { label: "⇧ Shift", code: "ShiftRight", w: 2.4 },
  ],
  [{ label: "Space", code: "Space", w: 8 }],
];

const AVRO: KeyDef[][] = [
  [
    { label: "~ `", code: "Backquote" },
    { label: "! ১", code: "Digit1" },
    { label: "@ ২", code: "Digit2" },
    { label: "# ৩", code: "Digit3" },
    { label: "৳ ৪", code: "Digit4" },
    { label: "% ৫", code: "Digit5" },
    { label: "^ ৬", code: "Digit6" },
    { label: "& ৭", code: "Digit7" },
    { label: "* ৮", code: "Digit8" },
    { label: "( ৯", code: "Digit9" },
    { label: ") ০", code: "Digit0" },
    { label: "_ -", code: "Minus" },
    { label: "+ =", code: "Equal" },
    { label: "⌫", code: "Backspace", w: 2 },
  ],
  [
    { label: "q", code: "KeyQ" },
    { label: "w (ওয়)", code: "KeyW" },
    { label: "e (এ/ে)", code: "KeyE" },
    { label: "r (র/্র)", code: "KeyR" },
    { label: "t (ট/ত)", code: "KeyT" },
    { label: "y (য়/্য)", code: "KeyY" },
    { label: "u (উ/ু)", code: "KeyU" },
    { label: "i (ই/ি)", code: "KeyI" },
    { label: "o (ও/ো)", code: "KeyO" },
    { label: "p (প)", code: "KeyP" },
    { label: "[", code: "BracketLeft" },
    { label: "]", code: "BracketRight" },
    { label: "\\", code: "Backslash", w: 1.4 },
  ],
  [
    { label: "a (আ/া)", code: "KeyA", w: 1.4 },
    { label: "s (স/শ)", code: "KeyS" },
    { label: "d (দ/ড)", code: "KeyD" },
    { label: "f (ফ)", code: "KeyF" },
    { label: "g (গ)", code: "KeyG" },
    { label: "h (হ)", code: "KeyH" },
    { label: "j (জ)", code: "KeyJ" },
    { label: "k (ক)", code: "KeyK" },
    { label: "l (ল)", code: "KeyL" },
    { label: ";", code: "Semicolon" },
    { label: "'", code: "Quote" },
    { label: "Enter ⏎", code: "Enter", w: 2 },
  ],
  [
    SHIFT,
    { label: "z (য)", code: "KeyZ" },
    { label: "x (ক্স)", code: "KeyX" },
    { label: "c (চ)", code: "KeyC" },
    { label: "v (ভ)", code: "KeyV" },
    { label: "b (ব)", code: "KeyB" },
    { label: "n (ন/ণ)", code: "KeyN" },
    { label: "m (ম)", code: "KeyM" },
    { label: "< ,", code: "Comma" },
    { label: "> ।", code: "Period" },
    { label: "? /", code: "Slash" },
    { label: "⇧ Shift", code: "ShiftRight", w: 2.4 },
  ],
  [{ label: "Space", code: "Space", w: 8 }],
];

const BIJOY: KeyDef[][] = [
  [
    { label: "~ `", code: "Backquote" },
    { label: "! ১", code: "Digit1" },
    { label: "@ ২", code: "Digit2" },
    { label: "# ৩", code: "Digit3" },
    { label: "৳ ৪", code: "Digit4" },
    { label: "% ৫", code: "Digit5" },
    { label: "^ ৬", code: "Digit6" },
    { label: "& ৭", code: "Digit7" },
    { label: "* ৮", code: "Digit8" },
    { label: "( ৯", code: "Digit9" },
    { label: ") ০", code: "Digit0" },
    { label: "_ -", code: "Minus" },
    { label: "+ =", code: "Equal" },
    { label: "⌫", code: "Backspace", w: 2 },
  ],
  [
    { label: "ং ঙ", code: "KeyQ" },
    { label: "য় য", code: "KeyW" },
    { label: "ঢ ড", code: "KeyE" },
    { label: "ফ প", code: "KeyR" },
    { label: "ঠ ট", code: "KeyT" },
    { label: "ছ চ", code: "KeyY" },
    { label: "ঝ জ", code: "KeyU" },
    { label: "ঞ হ", code: "KeyI" },
    { label: "ঘ গ", code: "KeyO" },
    { label: "ঢ় ড়", code: "KeyP" },
    { label: "{ [", code: "BracketLeft" },
    { label: "} ]", code: "BracketRight" },
    { label: "| \\", code: "Backslash", w: 1.4 },
  ],
  [
    { label: "র্ ৃ", code: "KeyA", w: 1.4 },
    { label: "ূ ু", code: "KeyS" },
    { label: "ী ি", code: "KeyD" },
    { label: "অ া", code: "KeyF" },
    { label: "্ (link)", code: "KeyG" },
    { label: "ভ ব", code: "KeyH" },
    { label: "খ ক", code: "KeyJ" },
    { label: "থ ত", code: "KeyK" },
    { label: "ধ দ", code: "KeyL" },
    { label: ": ;", code: "Semicolon" },
    { label: "\" '", code: "Quote" },
    { label: "Enter ⏎", code: "Enter", w: 2 },
  ],
  [
    SHIFT,
    { label: "্য ্র", code: "KeyZ" },
    { label: "ৌ ও", code: "KeyX" },
    { label: "ৈ ে", code: "KeyC" },
    { label: "ল র", code: "KeyV" },
    { label: "ণ ন", code: "KeyB" },
    { label: "ষ স", code: "KeyN" },
    { label: "শ ম", code: "KeyM" },
    { label: "< ,", code: "Comma" },
    { label: "> ।", code: "Period" },
    { label: "? /", code: "Slash" },
    { label: "⇧ Shift", code: "ShiftRight", w: 2.4 },
  ],
  [{ label: "Space", code: "Space", w: 8 }],
];

export const KEYBOARD_LAYOUTS: Record<KeyboardLayoutId, KeyboardLayout> = {
  qwerty: { name: "QWERTY", rows: QWERTY },
  dvorak: { name: "Dvorak", rows: DVORAK },
  colemak: { name: "Colemak", rows: COLEMAK },
  avro: {
    name: "Avro Phonetic",
    note: "English keys to Bangla Unicode",
    rows: AVRO,
  },
  bijoy: {
    name: "Bijoy Bangla",
    note: "Official Bijoy character layout",
    rows: BIJOY,
  },
};

export const KEYBOARD_LAYOUT_IDS = Object.keys(
  KEYBOARD_LAYOUTS,
) as KeyboardLayoutId[];
