"use client";

import { Keyboard } from "@/components/keyboard";
import { useSettingsStore } from "@/lib/store/settings";
import { KEYBOARD_LAYOUTS, KEYBOARD_LAYOUT_IDS } from "@/lib/typing/keyboard-layouts";
import { cn } from "@/lib/utils";
import { Section } from "./ui";

export function KeyboardSection() {
  const keyboardLayout = useSettingsStore((s) => s.keyboardLayout);
  const showKeyboard = useSettingsStore((s) => s.showKeyboard);
  const { update } = useSettingsStore();

  const englishLayouts = KEYBOARD_LAYOUT_IDS.filter((id) => id !== "avro" && id !== "bijoy");
  const banglaLayouts = KEYBOARD_LAYOUT_IDS.filter((id) => id === "avro" || id === "bijoy");

  return (
    <Section
      id="keyboard"
      title="Keyboard Layouts & Input Method"
      description="Choose your preferred typing layout for English and Bangla (Avro Phonetic or Bijoy)."
    >
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3">
        <div>
          <span className="font-mono text-xs font-semibold text-text">Show On-Screen Keyboard</span>
          <p className="font-mono text-[11px] text-subtext">Display interactive keyboard with live keypress and target guidance</p>
        </div>
        <button
          type="button"
          onClick={() => update({ showKeyboard: !showKeyboard })}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            showKeyboard ? "bg-main" : "bg-surface",
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-bg shadow ring-0 transition duration-200 ease-in-out",
              showKeyboard ? "translate-x-4" : "translate-x-0",
            )}
          />
        </button>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-main">
          Bangla Layouts (বাংলা)
        </h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {banglaLayouts.map((id) => {
            const layout = KEYBOARD_LAYOUTS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => update({ keyboardLayout: id })}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 text-left transition-all",
                  keyboardLayout === id
                    ? "border-main bg-main/15 shadow-sm shadow-main/10 ring-1 ring-main/50"
                    : "border-border bg-surface-2 hover:border-main/50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-text">
                    {layout.name}
                  </span>
                  {keyboardLayout === id && (
                    <span className="rounded bg-main/20 px-1.5 py-0.5 font-mono text-[10px] text-main font-bold">
                      Active
                    </span>
                  )}
                </div>
                {layout.note && (
                  <span className="mt-1 block font-mono text-[11px] text-subtext">
                    {layout.note}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-subtext">
          English Layouts
        </h4>
        <div className="flex flex-wrap gap-2">
          {englishLayouts.map((id) => {
            const layout = KEYBOARD_LAYOUTS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => update({ keyboardLayout: id })}
                className={cn(
                  "cursor-pointer rounded-lg border px-4 py-2 text-left transition-all",
                  keyboardLayout === id
                    ? "border-main bg-main/10 ring-1 ring-main/50"
                    : "border-border bg-surface-2 hover:border-main/50",
                )}
              >
                <span className="block font-mono text-xs text-text">
                  {layout.name}
                </span>
                {layout.note && (
                  <span className="block font-mono text-[10px] text-subtext">
                    {layout.note}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface-2/50 p-4">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-subtext">
          <span>Live Interactive Preview:</span>
          <span className="text-main font-semibold">{KEYBOARD_LAYOUTS[keyboardLayout]?.name}</span>
        </div>
        <Keyboard layoutId={keyboardLayout} />
      </div>
    </Section>
  );
}
