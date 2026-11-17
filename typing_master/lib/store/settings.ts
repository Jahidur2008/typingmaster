"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FONT_OPTIONS,
  PALETTE_VARS,
  PRESETS,
  type FontId,
  type Palette,
} from "@/lib/theme/presets";

export type ThemeMode = "dark" | "light";
export type ThemeSource = "default" | "preset" | "custom";
export type CaretStyle = "line" | "block" | "underline" | "outline";
export type SoundPackId = "click" | "typewriter" | "soft";
export type KeyboardLayoutId = "qwerty" | "dvorak" | "colemak" | "avro" | "bijoy";

export interface SettingsState {
  /* Theme */
  themeMode: ThemeMode;
  themeSource: ThemeSource;
  presetId: string;
  customColors: Palette;
  /* Appearance */
  fontFamily: FontId;
  fontSize: number;
  lineHeight: number;
  /* Caret */
  caretStyle: CaretStyle;
  caretSmooth: boolean;
  /* Sound */
  soundEnabled: boolean;
  volume: number; // 0–100
  soundPack: SoundPackId;
  errorSound: boolean;
  /* Behavior */
  stopOnError: boolean;
  blindMode: boolean;
  hideLiveWpm: boolean;
  showKeyboard: boolean;
  keyboardLayout: KeyboardLayoutId;
  /* Actions */
  update: (patch: Partial<Omit<SettingsState, "update" | "toggleTheme" | "setPreset" | "setCustomColor" | "resetSettings">>) => void;
  toggleTheme: () => void;
  setPreset: (id: string) => void;
  setCustomColor: (key: keyof Palette, value: string) => void;
  resetSettings: () => void;
}

export const DEFAULT_SETTINGS = {
  themeMode: "dark" as ThemeMode,
  themeSource: "default" as ThemeSource,
  presetId: "default",
  customColors: {
    bg: "#323437",
    surface: "#2c2e31",
    surface2: "#383a3e",
    text: "#d1d0c5",
    subtext: "#646669",
    main: "#e2b714",
    error: "#ca4754",
    correct: "#57c793",
  },
  fontFamily: "jetbrains" as FontId,
  fontSize: 28,
  lineHeight: 1.45,
  caretStyle: "line" as CaretStyle,
  caretSmooth: true,
  soundEnabled: false,
  volume: 50,
  soundPack: "click" as SoundPackId,
  errorSound: true,
  stopOnError: false,
  blindMode: false,
  hideLiveWpm: false,
  showKeyboard: false,
  keyboardLayout: "qwerty" as KeyboardLayoutId,
};

/**
 * Global settings store. Persisted to localStorage under "tm-settings",
 * but hydration is manual (SettingsProvider) so the server render and the
 * first client render both use the defaults — no hydration mismatch.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      toggleTheme: () =>
        set((s) => ({ themeMode: s.themeMode === "dark" ? "light" : "dark" })),
      setPreset: (id) =>
        set({
          presetId: id,
          themeSource: id === "default" ? "default" : "preset",
        }),
      setCustomColor: (key, value) =>
        set((s) => ({
          themeSource: "custom",
          customColors: { ...s.customColors, [key]: value },
        })),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: "tm-settings",
      skipHydration: true,
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  DOM application — the single place settings touch the document.    */
/*  Inline palette variables override :root / [data-theme] tokens.     */
/* ------------------------------------------------------------------ */

function applyPalette(style: CSSStyleDeclaration, palette: Palette | null) {
  const keys = Object.keys(PALETTE_VARS) as Array<keyof Palette>;
  for (const key of keys) {
    const prop = PALETTE_VARS[key];
    if (palette) style.setProperty(prop, palette[key]);
    else style.removeProperty(prop);
  }
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }
}

/**
 * Generates a crisp 64x64 PNG data URL of the theme-colored keyboard icon using Canvas.
 * PNG data URLs are universally rendered by Chrome, Firefox, Safari, and Edge in the browser tab bar,
 * whereas SVG data URIs are often ignored by Chromium's tab manager.
 */
export function generateFaviconPng(mainColor: string, bgColor: string = "#323437"): string {
  if (typeof document === "undefined") return "";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // 1. Draw rounded rectangle background with theme's main accent
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    drawRoundRect(ctx, 0, 0, 64, 64, 14);
    ctx.fill();

    // 2. Draw keyboard outer body with theme's background color
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    drawRoundRect(ctx, 10, 14, 44, 36, 6);
    ctx.stroke();

    // 3. Key dots (Row 1)
    ctx.fillStyle = bgColor;
    const row1 = [18, 27, 36, 45];
    for (let i = 0; i < row1.length; i++) {
      ctx.beginPath();
      ctx.arc(row1[i], 24, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Key dots (Row 2)
    const row2 = [22.5, 31.5, 40.5];
    for (let i = 0; i < row2.length; i++) {
      ctx.beginPath();
      ctx.arc(row2[i], 33, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Spacebar line
    ctx.beginPath();
    ctx.moveTo(20, 42);
    ctx.lineTo(44, 42);
    ctx.stroke();

    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

/**
 * Dynamically updates the browser tab favicon to reflect the active theme's accent and background colors.
 * Renders a crisp PNG data URL via Canvas and updates the existing icon <link> tags in place,
 * without removing or deleting DOM elements to ensure React 19 / Next.js hydration never breaks.
 */
export function updateDynamicFavicon(mainColor: string, bgColor: string = "#323437"): void {
  if (typeof document === "undefined") return;
  try {
    const pngUrl = generateFaviconPng(mainColor, bgColor);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="7" fill="${mainColor}"/><g transform="translate(4, 4)" fill="none" stroke="${bgColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/></g></svg>`;
    const svgUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    const iconHref = pngUrl || svgUrl;

    let dynamicLink = document.getElementById("tm-dynamic-favicon") as HTMLLinkElement | null;
    if (dynamicLink) {
      dynamicLink.remove();
    }
    dynamicLink = document.createElement("link");
    dynamicLink.id = "tm-dynamic-favicon";
    dynamicLink.rel = "icon";
    dynamicLink.type = pngUrl ? "image/png" : "image/svg+xml";
    dynamicLink.sizes = "64x64";
    dynamicLink.href = iconHref;
    document.head.appendChild(dynamicLink);

    let shortcut = document.getElementById("tm-dynamic-shortcut") as HTMLLinkElement | null;
    if (shortcut) {
      shortcut.remove();
    }
    shortcut = document.createElement("link");
    shortcut.id = "tm-dynamic-shortcut";
    shortcut.rel = "shortcut icon";
    shortcut.type = pngUrl ? "image/png" : "image/svg+xml";
    shortcut.href = iconHref;
    document.head.appendChild(shortcut);
  } catch (err) {
    console.warn("[favicon] Dynamic update error:", err);
  }
}

/** Apply every visual setting to <html> as CSS custom properties. */
export function applySettingsToDOM(s: SettingsState): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const style = root.style;

  root.dataset.theme = s.themeMode;

  const palette =
    s.themeSource === "custom"
      ? s.customColors
      : s.themeSource === "preset" && s.presetId !== "default"
        ? (PRESETS[s.presetId]?.[s.themeMode] ?? null)
        : null;
  applyPalette(style, palette);

  const mainColor = palette?.main ?? (s.themeMode === "light" ? "#d09b00" : "#e2b714");
  const bgColor = palette?.bg ?? (s.themeMode === "light" ? "#f1efe9" : "#323437");
  updateDynamicFavicon(mainColor, bgColor);

  const font = FONT_OPTIONS[s.fontFamily];
  if (font) style.setProperty("--typing-font-family", font.stack);
  else style.removeProperty("--typing-font-family");
  style.setProperty("--typing-font-size", `${s.fontSize}px`);
  style.setProperty("--typing-line-height", String(s.lineHeight));
}
