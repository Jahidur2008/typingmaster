"use client";

import { useEffect, useState } from "react";
import {
  KEYBOARD_LAYOUTS,
  type KeyDef,
} from "@/lib/typing/keyboard-layouts";
import type { KeyboardLayoutId } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const BANGLA_BIJOY_MAP: Record<string, string> = {
  "ক": "KeyJ", "খ": "KeyJ",
  "গ": "KeyO", "ঘ": "KeyO",
  "ঙ": "KeyQ", "ং": "KeyQ",
  "চ": "KeyY", "ছ": "KeyY",
  "জ": "KeyU", "ঝ": "KeyU",
  "ঞ": "KeyI",
  "ট": "KeyT", "ঠ": "KeyT",
  "ড": "KeyE", "ঢ": "KeyE",
  "ণ": "KeyB", "ন": "KeyB",
  "ত": "KeyK", "থ": "KeyK",
  "দ": "KeyL", "ধ": "KeyL",
  "প": "KeyR", "ফ": "KeyR",
  "ব": "KeyH", "ভ": "KeyH",
  "ম": "KeyM", "শ": "KeyM",
  "য": "KeyW", "য়": "KeyW",
  "র": "KeyV", "ল": "KeyV",
  "স": "KeyN", "ষ": "KeyN",
  "হ": "KeyI",
  "ড়": "KeyP", "ঢ়": "KeyP",
  "ৎ": "KeyK", "ঁ": "KeyN",
  "া": "KeyF", "ি": "KeyD", "ী": "KeyD",
  "ু": "KeyS", "ূ": "KeyS", "ৃ": "KeyA",
  "ে": "KeyC", "ৈ": "KeyC", "ো": "KeyX", "ৌ": "KeyX",
  "্": "KeyG",
  "অ": "KeyF", "আ": "KeyF",
  "ই": "KeyD", "ঈ": "KeyD",
  "উ": "KeyS", "ঊ": "KeyS",
  "ঋ": "KeyA",
  "এ": "KeyC", "ঐ": "KeyC",
  "ও": "KeyX", "ঔ": "KeyX",
  "।": "Period",
  "১": "Digit1", "২": "Digit2", "৩": "Digit3", "৪": "Digit4", "৫": "Digit5",
  "৬": "Digit6", "৭": "Digit7", "৮": "Digit8", "৯": "Digit9", "০": "Digit0",
};

const BANGLA_AVRO_MAP: Record<string, string> = {
  "ক": "KeyK", "খ": "KeyK",
  "গ": "KeyG", "ঘ": "KeyG",
  "ঙ": "KeyN", "ং": "KeyN",
  "চ": "KeyC", "ছ": "KeyC",
  "জ": "KeyJ", "ঝ": "KeyJ",
  "ঞ": "KeyN",
  "ট": "KeyT", "ঠ": "KeyT", "ত": "KeyT", "থ": "KeyT", "ৎ": "KeyT",
  "ড": "KeyD", "ঢ": "KeyD", "দ": "KeyD", "ধ": "KeyD",
  "ণ": "KeyN", "ন": "KeyN",
  "প": "KeyP", "ফ": "KeyF",
  "ব": "KeyB", "ভ": "KeyV",
  "ম": "KeyM",
  "য": "KeyZ", "য়": "KeyY",
  "র": "KeyR", "ড়": "KeyR", "ঢ়": "KeyR", "ল": "KeyL",
  "শ": "KeyS", "ষ": "KeyS", "স": "KeyS",
  "হ": "KeyH", "ঃ": "KeyH", "ঁ": "Digit6",
  "া": "KeyA", "আ": "KeyA", "অ": "KeyO",
  "ি": "KeyI", "ী": "KeyI", "ই": "KeyI", "ঈ": "KeyI",
  "ু": "KeyU", "ূ": "KeyU", "উ": "KeyU", "ঊ": "KeyU",
  "ৃ": "KeyR", "ঋ": "KeyR",
  "ে": "KeyE", "এ": "KeyE",
  "ৈ": "KeyO", "ঐ": "KeyO",
  "ো": "KeyO", "ও": "KeyO",
  "ৌ": "KeyO", "ঔ": "KeyO",
  "।": "Period",
  "১": "Digit1", "২": "Digit2", "৩": "Digit3", "৪": "Digit4", "৫": "Digit5",
  "৬": "Digit6", "৭": "Digit7", "৮": "Digit8", "৯": "Digit9", "০": "Digit0",
};

function charToCode(char?: string | null, layoutId?: KeyboardLayoutId): string | null {
  if (!char) return null;
  if (char === " ") return "Space";

  // Check Bangla character mapping
  const firstChar = Array.from(char)[0];
  if (firstChar && /[\u0980-\u09FF]/.test(firstChar)) {
    if (layoutId === "bijoy") {
      return BANGLA_BIJOY_MAP[firstChar] || null;
    }
    return BANGLA_AVRO_MAP[firstChar] || null;
  }

  if (char >= "a" && char <= "z") return `Key${char.toUpperCase()}`;
  if (char >= "A" && char <= "Z") return `Key${char}`;
  if (char >= "0" && char <= "9") return `Digit${char}`;

  const symbolMap: Record<string, string> = {
    "`": "Backquote",
    "~": "Backquote",
    "-": "Minus",
    _: "Minus",
    "=": "Equal",
    "+": "Equal",
    "[": "BracketLeft",
    "{": "BracketLeft",
    "]": "BracketRight",
    "}": "BracketRight",
    "\\": "Backslash",
    "|": "Backslash",
    ";": "Semicolon",
    ":": "Semicolon",
    "'": "Quote",
    '"': "Quote",
    ",": "Comma",
    "<": "Comma",
    ".": "Period",
    ">": "Period",
    "/": "Slash",
    "?": "Slash",
    "!": "Digit1",
    "@": "Digit2",
    "#": "Digit3",
    $: "Digit4",
    "%": "Digit5",
    "^": "Digit6",
    "&": "Digit7",
    "*": "Digit8",
    "(": "Digit9",
    ")": "Digit0",
  };

  return symbolMap[char] || null;
}

function Key({
  keyDef,
  pressed,
  isTarget,
  isSelected,
  onClick,
}: {
  keyDef: KeyDef;
  pressed: boolean;
  isTarget?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{ flexGrow: keyDef.w ?? 1, flexBasis: 0 }}
      className={cn(
        "flex h-9 items-center justify-center rounded-md border px-1 font-mono text-[11px] whitespace-nowrap transition-all duration-75 select-none",
        (keyDef.w ?? 1) > 1 && "text-[10px]",
        onClick ? "cursor-pointer hover:border-main/60" : "cursor-default",
        pressed
          ? "border-main bg-main font-bold text-bg shadow-md shadow-main/30 scale-95"
          : isTarget
            ? "border-main bg-main/30 font-bold text-main ring-2 ring-main/60 ring-offset-1 ring-offset-bg shadow-sm"
            : isSelected
              ? "border-main bg-main/20 font-bold text-main"
              : "border-border bg-surface-2 text-subtext",
      )}
    >
      {keyDef.label}
    </button>
  );
}

/**
 * On-screen keyboard.
 * Supports:
 *  - Highlighting physical key press
 *  - Highlighting the target key for the next letter (guided typing)
 *  - Interactive key click for individual key selection
 */
export function Keyboard({
  layoutId = "qwerty",
  targetChar,
  targetCode,
  selectedKey,
  onKeyClick,
  className,
}: {
  layoutId?: KeyboardLayoutId;
  targetChar?: string | null;
  targetCode?: string | null;
  selectedKey?: string | null;
  onKeyClick?: (keyLabel: string) => void;
  className?: string;
}) {
  const layout = KEYBOARD_LAYOUTS[layoutId] || KEYBOARD_LAYOUTS.qwerty;
  const [pressed, setPressed] = useState<string | null>(null);

  const resolvedTargetCode = targetCode || charToCode(targetChar, layoutId);

  useEffect(() => {
    const down = (e: KeyboardEvent) => setPressed(e.code);
    const up = () => setPressed(null);
    const clear = () => setPressed(null);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return (
    <div
      aria-hidden
      className={cn("mx-auto w-full max-w-3xl space-y-1.5 select-none", className)}
    >
      {layout.rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5">
          {row.map((keyDef, keyIndex) => {
            const isTarget = resolvedTargetCode === keyDef.code;
            const isSelected = selectedKey?.toLowerCase() === keyDef.label.toLowerCase();

            return (
              <Key
                key={keyIndex}
                keyDef={keyDef}
                pressed={pressed === keyDef.code}
                isTarget={isTarget}
                isSelected={isSelected}
                onClick={onKeyClick ? () => onKeyClick(keyDef.label) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
