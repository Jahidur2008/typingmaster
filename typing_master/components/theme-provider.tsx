"use client";

import { useSettingsStore } from "@/lib/store/settings";

/**
 * Theme state now lives in the settings store (see lib/store/settings.ts),
 * which is the single source of truth for `data-theme` and palette vars.
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.themeMode);
  const toggle = useSettingsStore((s) => s.toggleTheme);
  return { theme, toggle };
}
