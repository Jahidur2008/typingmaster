"use client";

import {
  FONT_IDS,
  FONT_OPTIONS,
  type FontId,
} from "@/lib/theme/presets";
import { useSettingsStore } from "@/lib/store/settings";
import { Section, SelectField, Slider } from "./ui";

export function AppearanceSection() {
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const lineHeight = useSettingsStore((s) => s.lineHeight);
  const { update } = useSettingsStore();

  return (
    <Section
      id="appearance"
      title="Appearance"
      description="Typing font, size and line height — used everywhere words are typed."
    >
      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-sm text-text">Font family</div>
        <SelectField<FontId>
          value={fontFamily}
          ariaLabel="Font family"
          onChange={(id) => update({ fontFamily: id })}
          options={FONT_IDS.map((id) => ({
            value: id,
            label: FONT_OPTIONS[id].name,
          }))}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-sm text-text">Font size</div>
        <Slider
          value={fontSize}
          min={16}
          max={48}
          step={1}
          suffix="px"
          onChange={(v) => update({ fontSize: v })}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="font-mono text-sm text-text">Line height</div>
        <Slider
          value={lineHeight}
          min={1}
          max={2.2}
          step={0.05}
          onChange={(v) => update({ lineHeight: v })}
        />
      </div>

      {/* Live sample in the actual typing font settings */}
      <div className="rounded-lg border border-border bg-surface-2/50 p-4">
        <div
          className="font-typing text-text"
          style={{
            fontSize: "var(--typing-font-size)",
            lineHeight: "var(--typing-line-height)",
          }}
        >
          <span className="text-text">the quick brown fox </span>
          <span className="text-subtext">jumps over </span>
          <span className="text-correct">the lazy dog</span>
        </div>
        <div className="mt-2 font-mono text-[11px] text-subtext">
          {FONT_OPTIONS[fontFamily].name} · {fontSize}px · {lineHeight}
        </div>
      </div>
    </Section>
  );
}
