"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  applySettingsToDOM,
  useSettingsStore,
} from "@/lib/store/settings";

/**
 * Rehydrates the settings store from localStorage and applies every
 * visual setting (CSS tokens, font, and dynamic theme favicon) to the document.
 * Runs on mount, on state changes, and on route changes.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    void useSettingsStore.persist.rehydrate();
    applySettingsToDOM(useSettingsStore.getState());
    const unsubStore = useSettingsStore.subscribe((state) => applySettingsToDOM(state));
    const unsubHydrate = useSettingsStore.persist.onFinishHydration((state) => {
      applySettingsToDOM(state);
    });

    return () => {
      unsubStore();
      unsubHydrate();
    };
  }, []);

  // Re-sync favicon and DOM properties on route navigation
  useEffect(() => {
    applySettingsToDOM(useSettingsStore.getState());
  }, [pathname]);

  return <>{children}</>;
}
