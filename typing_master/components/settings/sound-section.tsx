"use client";

import { Volume2 } from "lucide-react";
import {
  useSettingsStore,
  type SoundPackId,
} from "@/lib/store/settings";
import { playClick, playError } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { Row, Section, Slider, Toggle } from "./ui";

const PACKS: Array<{ value: SoundPackId; label: string }> = [
  { value: "click", label: "Click" },
  { value: "typewriter", label: "Typewriter" },
  { value: "soft", label: "Soft" },
];

export function SoundSection() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const soundPack = useSettingsStore((s) => s.soundPack);
  const errorSound = useSettingsStore((s) => s.errorSound);
  const { update } = useSettingsStore();

  const testSound = () => {
    if (soundEnabled) playClick(soundPack, volume / 100);
    if (errorSound) window.setTimeout(() => playError(volume / 100), 260);
  };

  return (
    <Section
      id="sound"
      title="Sound"
      description="Synthesized keystroke sounds — no assets, played via Web Audio."
    >
      <Row label="Sound effects" hint="Play a sound on every keystroke">
        <Toggle
          checked={soundEnabled}
          onChange={(v) => update({ soundEnabled: v })}
          label="Sound effects"
        />
      </Row>

      <Row label="Volume">
        <Slider
          value={volume}
          min={0}
          max={100}
          step={5}
          suffix="%"
          onChange={(v) => update({ volume: v })}
        />
      </Row>

      <Row label="Sound pack" hint="Character of the keypress sound">
        <div className="flex flex-wrap gap-2">
          {PACKS.map((pack) => (
            <button
              key={pack.value}
              type="button"
              onClick={() => update({ soundPack: pack.value })}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
                soundPack === pack.value
                  ? "bg-main font-bold text-bg"
                  : "bg-surface-2 text-subtext hover:text-text",
              )}
            >
              {pack.label}
            </button>
          ))}
          <button
            type="button"
            onClick={testSound}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-subtext transition-colors hover:border-main/60 hover:text-text"
          >
            <Volume2 className="h-3.5 w-3.5" />
            test
          </button>
        </div>
      </Row>

      <Row label="Error sound" hint="Extra buzz on wrong keystrokes">
        <Toggle
          checked={errorSound}
          onChange={(v) => update({ errorSound: v })}
          label="Error sound"
        />
      </Row>
    </Section>
  );
}
