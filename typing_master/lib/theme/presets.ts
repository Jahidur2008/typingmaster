/**
 * Theme preset palettes and typing-font registry.
 * Pure data (no React/zustand) so the pre-paint boot script and the
 * settings store can both consume it.
 *
 * Palettes mirror the core tokens in globals.css; derived tokens
 * (border, grid-line, glow, selection) are computed from them in CSS.
 */

export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  subtext: string;
  main: string;
  error: string;
  correct: string;
}

/** CSS custom-property names for each palette slot. */
export const PALETTE_VARS: Record<keyof Palette, string> = {
  bg: "--bg",
  surface: "--surface",
  surface2: "--surface-2",
  text: "--text",
  subtext: "--subtext",
  main: "--main",
  error: "--error",
  correct: "--correct",
};

/** Neutral light variant that keeps a preset's accent colors. */
function toLight(p: Palette): Palette {
  return {
    bg: "#f1efe9",
    surface: "#faf9f6",
    surface2: "#e3e0d9",
    text: "#3a3937",
    subtext: "#8d8c86",
    main: p.main,
    error: p.error,
    correct: p.correct,
  };
}

interface PresetDef {
  name: string;
  dark: Palette;
  /** Defaults to a neutral light variant reusing the dark accent colors. */
  light?: Palette;
}

const PRESET_DEFS: Record<string, PresetDef> = {
  matrix: {
    name: "Matrix",
    dark: {
      bg: "#111111",
      surface: "#0d0d0d",
      surface2: "#1d1d1d",
      text: "#15d96e",
      subtext: "#1a743c",
      main: "#15d96e",
      error: "#ea3c3c",
      correct: "#15d96e",
    },
  },
  carbon: {
    name: "Carbon",
    dark: {
      bg: "#313638",
      surface: "#2b2f31",
      surface2: "#3d4245",
      text: "#d1d0c5",
      subtext: "#84898b",
      main: "#f66e0d",
      error: "#ca4754",
      correct: "#57c793",
    },
  },
  dracula: {
    name: "Dracula",
    dark: {
      bg: "#282a36",
      surface: "#21222c",
      surface2: "#44475a",
      text: "#f8f8f2",
      subtext: "#6272a4",
      main: "#bd93f9",
      error: "#ff5555",
      correct: "#50fa7b",
    },
  },
  nord: {
    name: "Nord",
    dark: {
      bg: "#2e3440",
      surface: "#2b3140",
      surface2: "#434c5e",
      text: "#eceff4",
      subtext: "#7b88a1",
      main: "#88c0d0",
      error: "#bf616a",
      correct: "#a3be8c",
    },
  },
  gruvbox: {
    name: "Gruvbox",
    dark: {
      bg: "#282828",
      surface: "#242424",
      surface2: "#3c3836",
      text: "#ebdbb2",
      subtext: "#928374",
      main: "#fabd2f",
      error: "#fb4934",
      correct: "#b8bb26",
    },
  },
  metro: {
    name: "Metro",
    dark: {
      bg: "#14161a",
      surface: "#191c21",
      surface2: "#23262c",
      text: "#d1d0c5",
      subtext: "#6a6e78",
      main: "#e8395b",
      error: "#ca4754",
      correct: "#57c793",
    },
  },
  olivia: {
    name: "Olivia",
    dark: {
      bg: "#2b2328",
      surface: "#241d21",
      surface2: "#352b30",
      text: "#f2e6e0",
      subtext: "#8a757d",
      main: "#ff5757",
      error: "#e5484d",
      correct: "#30a46c",
    },
    light: {
      bg: "#fff3e0",
      surface: "#fff8ec",
      surface2: "#fbe0c3",
      text: "#5d4a66",
      subtext: "#b3979e",
      main: "#ff5757",
      error: "#e5484d",
      correct: "#30a46c",
    },
  },
  solarized: {
    name: "Solarized",
    dark: {
      bg: "#002b36",
      surface: "#073642",
      surface2: "#0a3d4a",
      text: "#93a1a1",
      subtext: "#657b83",
      main: "#b58900",
      error: "#dc322f",
      correct: "#859900",
    },
    light: {
      bg: "#fdf6e3",
      surface: "#f3ecd7",
      surface2: "#e4dcc3",
      text: "#586e75",
      subtext: "#93a1a1",
      main: "#b58900",
      error: "#dc322f",
      correct: "#859900",
    },
  },
  laser: {
    name: "Laser",
    dark: {
      bg: "#201a23",
      surface: "#1a151c",
      surface2: "#2b2430",
      text: "#ded6e6",
      subtext: "#6f6480",
      main: "#d846b3",
      error: "#ff5370",
      correct: "#5af78e",
    },
  },
};

export interface Preset {
  id: string;
  name: string;
  dark: Palette;
  light: Palette;
}

export const PRESETS: Record<string, Preset> = Object.fromEntries(
  Object.entries(PRESET_DEFS).map(([id, def]) => [
    id,
    {
      id,
      name: def.name,
      dark: def.dark,
      light: def.light ?? toLight(def.dark),
    },
  ]),
);

/* ------------------------------------------------------------------ */
/*  Typing fonts                                                       */
/* ------------------------------------------------------------------ */

export type FontId =
  | "jetbrains"
  | "fira"
  | "roboto"
  | "inter"
  | "bengali"
  | "system";

export const FONT_OPTIONS: Record<FontId, { name: string; stack: string }> = {
  jetbrains: {
    name: "JetBrains Mono",
    stack: "var(--font-jetbrains-mono), ui-monospace, monospace",
  },
  fira: {
    name: "Fira Code",
    stack: "var(--font-fira-code), ui-monospace, monospace",
  },
  roboto: {
    name: "Roboto Mono",
    stack: "var(--font-roboto-mono), ui-monospace, monospace",
  },
  inter: {
    name: "Inter",
    stack: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  bengali: {
    name: "Noto Sans Bengali",
    stack: "var(--font-noto-bengali), var(--font-inter), sans-serif",
  },
  system: {
    name: "System",
    stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
};

export const FONT_IDS = Object.keys(FONT_OPTIONS) as FontId[];
