"use client";

import { useSettingsStore, type CaretStyle } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { Row, Section, Toggle } from "./ui";

const CARET_OPTIONS: Array<{ value: CaretStyle; label: string }> = [
  { value: "line", label: "line" },
  { value: "block", label: "block" },
  { value: "underline", label: "underline" },
  { value: "outline", label: "outline" },
];

const caretClasses: Record<CaretStyle, string> = {
  line: "h-[1.15em] w-[3px] rounded-full bg-main",
  block: "h-[1.15em] w-[1.05ch] rounded-[2px] bg-main/60",
  underline: "h-[3px] w-[1.05ch] translate-y-[1.05em] rounded-full bg-main",
  outline: "h-[1.15em] w-[1.05ch] rounded-[3px] border-2 border-main",
};

export function CaretSection() {
  const caretStyle = useSettingsStore((s) => s.caretStyle);
  const caretSmooth = useSettingsStore((s) => s.caretSmooth);
  const { update } = useSettingsStore();

  return (
    <Section
      id="caret"
      title="Caret"
      description="How the cursor looks and moves while typing."
    >
      <Row label="Caret style" stacked>
        <div className="flex flex-wrap items-center gap-3">
          {CARET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ caretStyle: opt.value })}
              className={cn(
                "flex h-10 cursor-pointer items-center rounded-lg border px-4 transition-all",
                caretStyle === opt.value
                  ? "border-main bg-main/10"
                  : "border-border bg-surface-2 hover:border-main/50",
              )}
            >
              <span className={cn("block", caretClasses[opt.value])} />
              <span className="ml-2.5 font-mono text-xs text-text">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </Row>

      <Row label="Smooth animation" hint="Caret glides between characters instead of jumping">
        <Toggle
          checked={caretSmooth}
          onChange={(v) => update({ caretSmooth: v })}
          label="Smooth caret animation"
        />
      </Row>
    </Section>
  );
}
