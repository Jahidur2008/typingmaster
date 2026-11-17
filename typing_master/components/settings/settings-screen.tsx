"use client";

import { useState } from "react";
import {
  Keyboard as KeyboardIcon,
  MousePointer2,
  Paintbrush,
  RotateCcw,
  SlidersHorizontal,
  Type,
  Volume2,
} from "lucide-react";
import { useSettingsStore } from "@/lib/store/settings";
import { cn } from "@/lib/utils";
import { ThemeSection } from "./theme-section";
import { AppearanceSection } from "./appearance-section";
import { CaretSection } from "./caret-section";
import { SoundSection } from "./sound-section";
import { BehaviorSection } from "./behavior-section";
import { KeyboardSection } from "./keyboard-section";

const NAV = [
  { id: "theme", label: "Theme", icon: Paintbrush },
  { id: "appearance", label: "Appearance", icon: Type },
  { id: "caret", label: "Caret", icon: MousePointer2 },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "behavior", label: "Behavior", icon: SlidersHorizontal },
  { id: "keyboard", label: "Keyboard", icon: KeyboardIcon },
] as const;

export function SettingsScreen() {
  const [active, setActive] = useState<string>("theme");
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  const goTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-typing text-2xl font-bold text-text">Settings</h1>
          <p className="mt-1 font-mono text-xs text-subtext">
            everything applies instantly · saved in this browser
          </p>
        </div>
        <button
          type="button"
          onClick={resetSettings}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-mono text-xs text-subtext transition-colors hover:border-error/60 hover:text-text"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          reset all
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="lg:sticky lg:top-24 lg:h-fit lg:w-48 lg:shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(item.id)}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs transition-colors lg:w-full",
                  active === item.id
                    ? "bg-main/10 font-bold text-main"
                    : "text-subtext hover:bg-surface-2 hover:text-text",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="min-w-0 flex-1 space-y-8">
          <ThemeSection />
          <AppearanceSection />
          <CaretSection />
          <SoundSection />
          <BehaviorSection />
          <KeyboardSection />
        </div>
      </div>
    </div>
  );
}
