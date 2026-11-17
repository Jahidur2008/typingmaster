export type Hand = "left" | "right";
export type Finger = "pinky" | "ring" | "middle" | "index" | "thumb";

export interface FingerInfo {
  hand: Hand;
  finger: Finger;
  label: string;
  fingerKey: string; // e.g. "left-index"
}

const FINGER_MAP: Record<string, { hand: Hand; finger: Finger }> = {
  // Left Pinky
  "`": { hand: "left", finger: "pinky" },
  "~": { hand: "left", finger: "pinky" },
  "1": { hand: "left", finger: "pinky" },
  "!": { hand: "left", finger: "pinky" },
  q: { hand: "left", finger: "pinky" },
  Q: { hand: "left", finger: "pinky" },
  a: { hand: "left", finger: "pinky" },
  A: { hand: "left", finger: "pinky" },
  z: { hand: "left", finger: "pinky" },
  Z: { hand: "left", finger: "pinky" },

  // Left Ring
  "2": { hand: "left", finger: "ring" },
  "@": { hand: "left", finger: "ring" },
  w: { hand: "left", finger: "ring" },
  W: { hand: "left", finger: "ring" },
  s: { hand: "left", finger: "ring" },
  S: { hand: "left", finger: "ring" },
  x: { hand: "left", finger: "ring" },
  X: { hand: "left", finger: "ring" },

  // Left Middle
  "3": { hand: "left", finger: "middle" },
  "#": { hand: "left", finger: "middle" },
  e: { hand: "left", finger: "middle" },
  E: { hand: "left", finger: "middle" },
  d: { hand: "left", finger: "middle" },
  D: { hand: "left", finger: "middle" },
  c: { hand: "left", finger: "middle" },
  C: { hand: "left", finger: "middle" },

  // Left Index
  "4": { hand: "left", finger: "index" },
  $: { hand: "left", finger: "index" },
  "5": { hand: "left", finger: "index" },
  "%": { hand: "left", finger: "index" },
  r: { hand: "left", finger: "index" },
  R: { hand: "left", finger: "index" },
  t: { hand: "left", finger: "index" },
  T: { hand: "left", finger: "index" },
  f: { hand: "left", finger: "index" },
  F: { hand: "left", finger: "index" },
  g: { hand: "left", finger: "index" },
  G: { hand: "left", finger: "index" },
  v: { hand: "left", finger: "index" },
  V: { hand: "left", finger: "index" },
  b: { hand: "left", finger: "index" },
  B: { hand: "left", finger: "index" },

  // Spacebar -> Thumb
  " ": { hand: "right", finger: "thumb" },

  // Right Index
  "6": { hand: "right", finger: "index" },
  "^": { hand: "right", finger: "index" },
  "7": { hand: "right", finger: "index" },
  "&": { hand: "right", finger: "index" },
  y: { hand: "right", finger: "index" },
  Y: { hand: "right", finger: "index" },
  u: { hand: "right", finger: "index" },
  U: { hand: "right", finger: "index" },
  h: { hand: "right", finger: "index" },
  H: { hand: "right", finger: "index" },
  j: { hand: "right", finger: "index" },
  J: { hand: "right", finger: "index" },
  n: { hand: "right", finger: "index" },
  N: { hand: "right", finger: "index" },
  m: { hand: "right", finger: "index" },
  M: { hand: "right", finger: "index" },

  // Right Middle
  "8": { hand: "right", finger: "middle" },
  "*": { hand: "right", finger: "middle" },
  i: { hand: "right", finger: "middle" },
  I: { hand: "right", finger: "middle" },
  k: { hand: "right", finger: "middle" },
  K: { hand: "right", finger: "middle" },
  ",": { hand: "right", finger: "middle" },
  "<": { hand: "right", finger: "middle" },

  // Right Ring
  "9": { hand: "right", finger: "ring" },
  "(": { hand: "right", finger: "ring" },
  o: { hand: "right", finger: "ring" },
  O: { hand: "right", finger: "ring" },
  l: { hand: "right", finger: "ring" },
  L: { hand: "right", finger: "ring" },
  ".": { hand: "right", finger: "ring" },
  ">": { hand: "right", finger: "ring" },

  // Right Pinky
  "0": { hand: "right", finger: "pinky" },
  ")": { hand: "right", finger: "pinky" },
  "-": { hand: "right", finger: "pinky" },
  _: { hand: "right", finger: "pinky" },
  "=": { hand: "right", finger: "pinky" },
  "+": { hand: "right", finger: "pinky" },
  p: { hand: "right", finger: "pinky" },
  P: { hand: "right", finger: "pinky" },
  "[": { hand: "right", finger: "pinky" },
  "{": { hand: "right", finger: "pinky" },
  "]": { hand: "right", finger: "pinky" },
  "}": { hand: "right", finger: "pinky" },
  "\\": { hand: "right", finger: "pinky" },
  "|": { hand: "right", finger: "pinky" },
  ";": { hand: "right", finger: "pinky" },
  ":": { hand: "right", finger: "pinky" },
  "'": { hand: "right", finger: "pinky" },
  '"': { hand: "right", finger: "pinky" },
  "/": { hand: "right", finger: "pinky" },
  "?": { hand: "right", finger: "pinky" },
};

export function getFingerForKey(char?: string | null): FingerInfo | null {
  if (!char) return null;
  const match = FINGER_MAP[char];
  if (!match) return null;

  const handName = match.hand === "left" ? "Left" : "Right";
  const fingerName =
    match.finger === "thumb"
      ? "Thumb"
      : `${match.finger.charAt(0).toUpperCase() + match.finger.slice(1)} Finger`;

  return {
    hand: match.hand,
    finger: match.finger,
    label: `${handName} ${fingerName}`,
    fingerKey: `${match.hand}-${match.finger}`,
  };
}
