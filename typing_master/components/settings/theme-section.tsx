"use client";

import { Check, Moon, Paintbrush, Sun } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  useSettingsStore,
  type ThemeMode,
} from "@/lib/store/settings";
import { PRESETS, type Palette } from "@/lib/theme/presets";
import { cn } from "@/lib/utils";
import { Row, Section } from "./ui";

const PRESET_IDS = ["default", ...Object.keys(PRESETS)] as const;

function presetName(id: string): string {
  return id === "default" ? "Default" : PRESETS[id]?.name ?? id;
}

function presetPalette(id: string, mode: ThemeMode): Palette {
  if (id === "default") {
    return mode === "light"
      ? {
          bg: "#e8e6e1",
          surface: "#f4f3ef",
          surface2: "#dddbd5",
          text: "#353431",
          subtext: "#8d8c86",
          main: "#d9a912",
          error: "#c2424f",
          correct: "#2e9b77",
        }
      : {
          bg: "#323437",
          surface: "#2c2e31",
          surface2: "#383a3e",
          text: "#d1d0c5",
          subtext: "#646669",
          main: "#e2b714",
          error: "#ca4754",
          correct: "#57c793",
        };
  }
  return PRESETS[id][mode];
}

/** Miniature mock of the typing screen rendered in a palette. */
function PalettePreview({ palette }: { palette: Palette }) {
  return (
    <div
      className="h-20 w-full overflow-hidden rounded-md p-2.5 text-left"
      style={{ background: palette.bg }}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="font-typing text-sm" style={{ color: palette.text }}>
          the
        </span>
        <span
          className="font-typing text-sm underline decoration-2 underline-offset-4"
          style={{ color: palette.error, textDecorationColor: palette.error }}
        >
          qui
        </span>
        <span className="font-typing text-sm" style={{ color: palette.subtext }}>
          ck
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <span
          className="inline-block h-4 w-[3px] rounded-full"
          style={{ background: palette.main }}
        />
        <span className="font-typing text-sm" style={{ color: palette.subtext }}>
          brown
        </span>
      </div>
      <div className="mt-2 flex gap-1.5">
        <span className="h-1 w-5 rounded-full" style={{ background: palette.correct }} />
        <span className="h-1 w-5 rounded-full" style={{ background: palette.error }} />
        <span className="h-1 w-5 rounded-full" style={{ background: palette.main }} />
      </div>
    </div>
  );
}

export function ThemeSection() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const themeSource = useSettingsStore((s) => s.themeSource);
  const presetId = useSettingsStore((s) => s.presetId);
  const customColors = useSettingsStore((s) => s.customColors);
  const { update, toggleTheme, setPreset, setCustomColor } = useSettingsStore();

  return (
    <Section
      id="theme"
      title="Theme"
      description="Colors apply instantly across the whole site."
    >
      <Row label="Appearance mode">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text transition-colors hover:border-main/60"
        >
          {themeMode === "dark" ? (
            <Moon className="h-4 w-4 text-main" />
          ) : (
            <Sun className="h-4 w-4 text-main" />
          )}
          {themeMode === "dark" ? "Dark" : "Light"}
        </button>
      </Row>

      <div className="space-y-2">
        <div className="font-mono text-sm text-text">Presets</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PRESET_IDS.map((id) => {
            const active =
              themeSource === "custom" ? false : presetId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPreset(id)}
                className={cn(
                  "group cursor-pointer rounded-lg border p-2 text-left transition-all",
                  active
                    ? "border-main ring-1 ring-main"
                    : "border-border hover:border-main/50",
                )}
              >
                <PalettePreview palette={presetPalette(id, themeMode)} />
                <div className="mt-2 flex items-center justify-between px-0.5">
                  <span className="font-mono text-xs text-text">
                    {presetName(id)}
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-main" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom theme editor */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm text-text">
            <Paintbrush className="h-4 w-4 text-main" />
            Custom theme
          </div>
          <button
            type="button"
            onClick={() => update({ themeSource: "custom" })}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
              themeSource === "custom"
                ? "bg-main font-bold text-bg"
                : "bg-surface-2 text-subtext hover:text-text",
            )}
          >
            {themeSource === "custom" ? "Active" : "Use custom"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["bg", "Background"],
              ["main", "Main (accent)"],
              ["text", "Text"],
              ["subtext", "Subtext"],
              ["error", "Error"],
              ["correct", "Correct"],
            ] as Array<[keyof typeof customColors, string]>
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2 transition-colors hover:border-main/50"
            >
              <input
                type="color"
                value={customColors[key]}
                onChange={(e) => setCustomColor(key, e.target.value)}
                aria-label={`${label} color`}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs text-text">{label}</span>
              <span className="ml-auto font-mono text-[10px] text-subtext uppercase">
                {customColors[key]}
              </span>
            </label>
          ))}
        </div>

        {/* Live preview, rendered directly from the editable palette */}
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-wide text-subtext uppercase">
            Live preview
          </div>
          <PalettePreview palette={customColors} />
        </div>
        {themeSource === "custom" && (
          <button
            type="button"
            onClick={() =>
              useSettingsStore.setState({
                customColors: DEFAULT_SETTINGS.customColors,
              })
            }
            className="cursor-pointer font-mono text-xs text-subtext transition-colors hover:text-text"
          >
            reset custom colors
          </button>
        )}
      </div>
    </Section>
  );
}
