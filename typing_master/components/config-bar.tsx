"use client";

import { AtSign, Hash } from "lucide-react";
import {
  QUOTE_LENGTH_OPTIONS,
  TEST_MODES,
  TIME_OPTIONS,
  WORD_OPTIONS,
  type TestMode,
  type TypingConfig,
} from "@/lib/typing/config";
import type { Language, QuoteLength } from "@/lib/typing/data";
import { useSettingsStore } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<TestMode, string> = {
  time: "time",
  words: "words",
  quote: "quote",
  custom: "custom",
  zen: "zen",
  random: "random",
};

const LANGUAGES: Array<{ id: Language; label: string }> = [
  { id: "english", label: "english" },
  { id: "bangla", label: "বাংলা" },
];

const QUOTE_LABELS: Record<QuoteLength, string> = {
  short: "short",
  medium: "medium",
  long: "long",
};

function Pill({
  active,
  onClick,
  children,
  banglaFont,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  banglaFont?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded px-1.5 py-0.5 transition-colors",
        active ? "bg-main/15 text-main" : "text-subtext hover:text-text",
        banglaFont && "font-bangla",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1.5 text-subtext/40">|</span>;
}

export function ConfigBar({
  config,
  onPatch,
  customDraft,
  onCustomDraftChange,
  onApplyCustom,
}: {
  config: TypingConfig;
  onPatch: (patch: Partial<TypingConfig>) => void;
  customDraft: string;
  onCustomDraftChange: (value: string) => void;
  onApplyCustom: () => void;
}) {
  const keyboardLayout = useSettingsStore((s) => s.keyboardLayout);
  const updateSettings = useSettingsStore((s) => s.update);

  const mode = config.mode;
  const hasOptions = mode === "time" || mode === "words" || mode === "quote";

  return (
    <div className="mb-6 select-none">
      {/* Row 1: modifiers | modes | language */}
      <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-xs">
        <Pill
          active={config.punctuation}
          onClick={() => onPatch({ punctuation: !config.punctuation })}
        >
          <span className="inline-flex items-center gap-1">
            <AtSign className="h-3 w-3" />
            punctuation
          </span>
        </Pill>
        <Pill active={config.numbers} onClick={() => onPatch({ numbers: !config.numbers })}>
          <span className="inline-flex items-center gap-1">
            <Hash className="h-3 w-3" />
            numbers
          </span>
        </Pill>

        <Divider />

        {TEST_MODES.map((m) => (
          <Pill key={m} active={mode === m} onClick={() => onPatch({ mode: m })}>
            {MODE_LABELS[m]}
          </Pill>
        ))}

        <Divider />

        {LANGUAGES.map((lang) => (
          <Pill
            key={lang.id}
            active={config.language === lang.id}
            onClick={() => {
              onPatch({ language: lang.id });
              if (
                lang.id === "bangla" &&
                keyboardLayout !== "bijoy" &&
                keyboardLayout !== "avro"
              ) {
                updateSettings({ keyboardLayout: "avro" });
              }
            }}
            banglaFont={lang.id === "bangla"}
          >
            {lang.label}
          </Pill>
        ))}

        {config.language === "bangla" && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px]">
            <span className="text-subtext/60">লেআউট:</span>
            <button
              type="button"
              onClick={() => updateSettings({ keyboardLayout: "avro" })}
              className={cn(
                "cursor-pointer rounded px-1.5 py-0.5 font-bangla transition-colors",
                keyboardLayout === "avro" ||
                  keyboardLayout === "qwerty" ||
                  !keyboardLayout
                  ? "bg-main/20 font-bold text-main"
                  : "text-subtext hover:text-text",
              )}
            >
              অভ্র
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ keyboardLayout: "bijoy" })}
              className={cn(
                "cursor-pointer rounded px-1.5 py-0.5 font-bangla transition-colors",
                keyboardLayout === "bijoy"
                  ? "bg-main/20 font-bold text-main"
                  : "text-subtext hover:text-text",
              )}
            >
              বিজয়
            </button>
          </span>
        )}
      </div>

      {/* Row 2: mode-specific options */}
      {(hasOptions || mode === "custom") && (
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 font-mono text-xs">
          {mode === "time" &&
            TIME_OPTIONS.map((t) => (
              <Pill
                key={t}
                active={config.timeSeconds === t}
                onClick={() => onPatch({ timeSeconds: t })}
              >
                {t}
              </Pill>
            ))}
          {mode === "words" &&
            WORD_OPTIONS.map((w) => (
              <Pill
                key={w}
                active={config.wordCount === w}
                onClick={() => onPatch({ wordCount: w })}
              >
                {w}
              </Pill>
            ))}
          {mode === "quote" &&
            QUOTE_LENGTH_OPTIONS.map((q) => (
              <Pill
                key={q}
                active={config.quoteLength === q}
                onClick={() => onPatch({ quoteLength: q })}
              >
                {QUOTE_LABELS[q]}
              </Pill>
            ))}
        </div>
      )}

      {/* Custom text panel */}
      {mode === "custom" && (
        <div className="mx-auto mt-3 max-w-xl">
          <textarea
            value={customDraft}
            onChange={(e) => onCustomDraftChange(e.target.value)}
            rows={3}
            placeholder="paste your own text here…"
            spellCheck={false}
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtext/70 focus:border-main/50 focus:outline-none"
          />
          <div className="mt-2 flex justify-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={onApplyCustom}
              disabled={customDraft.trim().length === 0}
              className="cursor-pointer rounded bg-main/15 px-3 py-1 text-main transition-colors hover:bg-main/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              start test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
