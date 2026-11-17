"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettingsStore, generateFaviconPng } from "@/lib/store/settings";
import { PRESETS } from "@/lib/theme/presets";

/**
 * Client component that continuously synchronizes the browser tab's favicon
 * with the active theme's accent and background colors across EVERY page.
 *
 * Runs whenever:
 * 1. The page route/URL changes (pathname change)
 * 2. The active preset changes (e.g. Matrix, Dracula, Nord, Metro, etc.)
 * 3. The appearance mode changes (Dark <-> Light)
 * 4. Custom palette colors change
 */
export function DynamicFavicon() {
  const pathname = usePathname();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const themeSource = useSettingsStore((s) => s.themeSource);
  const presetId = useSettingsStore((s) => s.presetId);
  const customColors = useSettingsStore((s) => s.customColors);

  useEffect(() => {
    const palette =
      themeSource === "custom"
        ? customColors
        : themeSource === "preset" && presetId !== "default"
          ? (PRESETS[presetId]?.[themeMode] ?? null)
          : null;

    const mainColor = palette?.main ?? (themeMode === "light" ? "#d09b00" : "#e2b714");
    const bgColor = palette?.bg ?? (themeMode === "light" ? "#f1efe9" : "#323437");

    const pngUrl = generateFaviconPng(mainColor, bgColor);
    if (!pngUrl) return;

    // Re-create the dynamic favicon link in document.head
    // In Chromium, removing and re-appending triggers an instant tab bar icon repaint
    let link = document.getElementById("tm-dynamic-favicon") as HTMLLinkElement | null;
    if (link) {
      link.remove();
    }
    link = document.createElement("link");
    link.id = "tm-dynamic-favicon";
    link.rel = "icon";
    link.type = "image/png";
    link.sizes = "64x64";
    link.href = pngUrl;
    document.head.appendChild(link);

    let shortcut = document.getElementById("tm-dynamic-shortcut") as HTMLLinkElement | null;
    if (shortcut) {
      shortcut.remove();
    }
    shortcut = document.createElement("link");
    shortcut.id = "tm-dynamic-shortcut";
    shortcut.rel = "shortcut icon";
    shortcut.type = "image/png";
    shortcut.href = pngUrl;
    document.head.appendChild(shortcut);
  }, [pathname, themeMode, themeSource, presetId, customColors]);

  return null;
}
