"use client";

import {
  useSettingsStore,
  type SettingsState,
} from "@/lib/store/settings";
import { Row, Section, Toggle } from "./ui";

const BEHAVIORS = [
  {
    key: "stopOnError" as const,
    label: "Stop on error",
    hint: "Reject wrong keystrokes — the word must be typed correctly",
  },
  {
    key: "blindMode" as const,
    label: "Blind mode",
    hint: "No error colors or underlines while typing",
  },
  {
    key: "hideLiveWpm" as const,
    label: "Hide live WPM",
    hint: "Don't show the wpm counter during a test",
  },
  {
    key: "showKeyboard" as const,
    label: "Show keyboard",
    hint: "On-screen keyboard with live keypress highlighting",
  },
];

export function BehaviorSection() {
  // Whole-store subscription: settings change rarely, and this section
  // reads several fields at once.
  const settings = useSettingsStore();
  const { update } = useSettingsStore();

  return (
    <Section
      id="behavior"
      title="Behavior"
      description="Test-flow options, applied to every typing test."
    >
      {BEHAVIORS.map((b) => (
        <Row key={b.key} label={b.label} hint={b.hint}>
          <Toggle
            checked={settings[b.key]}
            onChange={(v) => update({ [b.key]: v } as Partial<SettingsState>)}
            label={b.label}
          />
        </Row>
      ))}
    </Section>
  );
}
