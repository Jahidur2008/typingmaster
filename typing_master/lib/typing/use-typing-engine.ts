"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  calcAccuracy,
  calcWpm,
  computeResults,
  createEngineState,
  splitGraphemes,
  totalCorrectChars,
  typingEngineReducer,
  type TypingResults,
} from "./engine";
import { applyNumbers, applyPunctuation, generateWords } from "./words";
import { pickQuote } from "./data";
import type { TypingConfig } from "./config";
import { useSettingsStore } from "@/lib/store/settings";
import { playClick, playError } from "@/lib/sound";
import { avroPhonetic } from "./avro-phonetic";
import { bijoyConvert } from "./bijoy";

export interface LiveStats {
  wpm: number;
  accuracy: number;
  seconds: number;
  /** Time mode: seconds left; null otherwise. */
  remaining: number | null;
  running: boolean;
}

/** Apply punctuation/number modifiers to a word pool (word modes only). */
function decorate(words: string[], cfg: TypingConfig): string[] {
  let out = words;
  if (cfg.punctuation) out = applyPunctuation(out);
  if (cfg.numbers) out = applyNumbers(out);
  return out;
}

/** Build the word list for a test from the configuration. */
function buildWords(cfg: TypingConfig): string[] {
  switch (cfg.mode) {
    case "time":
      // Generous starting pool; more are appended while typing.
      return decorate(generateWords(cfg.language, 60), cfg);
    case "words":
      return decorate(generateWords(cfg.language, cfg.wordCount), cfg);
    case "quote": {
      const quote = pickQuote(cfg.language, cfg.quoteLength);
      return quote
        ? quote.text.trim().split(/\s+/)
        : decorate(generateWords(cfg.language, cfg.wordCount), cfg);
    }
    case "custom": {
      const parts = cfg.customText.trim().split(/\s+/).filter(Boolean);
      return parts.length > 0
        ? parts
        : decorate(generateWords(cfg.language, 10), cfg);
    }
    case "zen":
      return [];
    case "random": {
      const quote =
        Math.random() < 0.4 ? pickQuote(cfg.language, cfg.quoteLength) : null;
      return quote
        ? quote.text.trim().split(/\s+/)
        : decorate(generateWords(cfg.language, cfg.wordCount), cfg);
    }
    // Runtime safety net for unexpected modes (e.g. stale localStorage).
    default:
      return decorate(generateWords(cfg.language, cfg.wordCount), cfg);
  }
}

function timeLimitMsFor(cfg: TypingConfig): number | null {
  return cfg.mode === "time" ? cfg.timeSeconds * 1000 : null;
}

/**
 * Binds the pure typing engine to React:
 * - a hidden input holds the active word's value (IME/mobile friendly)
 * - keydown handles space (submit), empty-backspace (previous word),
 *   Tab+Enter (new test) / Esc (reset) — guarded against IME composition
 * - time mode runs a countdown and appends words while typing
 * - zen mode has no target text; Enter (or the end button) finishes it
 */
export function useTypingEngine(config: TypingConfig) {
  // Start with no words so the server render is deterministic; the random
  // word list is generated in the browser after hydration.
  const [state, dispatch] = useReducer(
    typingEngineReducer,
    undefined,
    () => createEngineState([]),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [now, setNow] = useState(0);
  const tabPressedAtRef = useRef(0);
  // Latest config for callbacks/effects (synced in an effect, not render).
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  // Latest reducer state for callbacks/effects.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  /** Start (or restart) a test from the given configuration. */
  const startTest = useCallback(
    (cfg: TypingConfig) => {
      if (inputRef.current) inputRef.current.value = "";
      dispatch({
        type: "RESTART",
        words: buildWords(cfg),
        timeLimitMs: timeLimitMsFor(cfg),
        zen: cfg.mode === "zen",
      });
      focusInput();
    },
    [focusInput],
  );

  /** New test: fresh words. Bound to Tab+Enter and the restart button. */
  const restart = useCallback(() => {
    startTest(configRef.current);
  }, [startTest]);

  /** Reset: replay the exact same words. Bound to Esc. */
  const reset = useCallback(() => {
    const s = stateRef.current;
    if (inputRef.current) inputRef.current.value = "";
    if (s.words.length > 0 || s.zen) {
      dispatch({
        type: "RESTART",
        words: s.words,
        timeLimitMs: s.timeLimitMs,
        zen: s.zen,
      });
    } else {
      startTest(configRef.current);
    }
    focusInput();
  }, [startTest, focusInput]);

  /** Manually end a zen session. */
  const endZen = useCallback(() => {
    dispatch({ type: "END_ZEN", now: Date.now() });
  }, []);

  // Restart whenever the configuration changes. This also generates the
  // first test after mount, keeping Math.random out of the server render.
  const configKey = useMemo(() => JSON.stringify(config), [config]);
  const prevConfigKeyRef = useRef<string | null>(null);
  useEffect(() => {
    prevConfigKeyRef.current = configKey;
    startTest(configRef.current);
  }, [configKey, startTest]);

  // Time mode: append a fresh batch of words when nearing the end of the pool.
  useEffect(() => {
    if (!state.startedAt || state.finished) return;
    if (configRef.current.mode !== "time") return;
    if (state.words.length - state.activeIndex > 25) return;
    dispatch({
      type: "APPEND_WORDS",
      words: decorate(
        generateWords(configRef.current.language, 30),
        configRef.current,
      ),
    });
  }, [state.activeIndex, state.words.length, state.startedAt, state.finished]);

  // One WPM sample per second, only while running.
  useEffect(() => {
    if (!state.startedAt || state.finished) return;
    const id = window.setInterval(
      () => dispatch({ type: "TICK", now: Date.now() }),
      1000,
    );
    return () => window.clearInterval(id);
  }, [state.startedAt, state.finished]);

  // Smooth timer display + time-mode countdown (checked every 100ms).
  useEffect(() => {
    if (!state.startedAt || state.finished) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const s = stateRef.current;
      if (
        s.timeLimitMs !== null &&
        s.startedAt !== null &&
        t - s.startedAt >= s.timeLimitMs
      ) {
        dispatch({ type: "TIME_UP" });
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [state.startedAt, state.finished]);

  // Auto-focus on mount.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Start typing anywhere on the page → focus the hidden input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = inputRef.current;
      if (!el || document.activeElement === el) return;
      // Never steal focus from another text field (e.g. custom text panel).
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      el.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      // Never intercept IME composition (essential for Bangla).
      if (e.nativeEvent.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (state.finished) {
        if (e.key === "Enter") {
          e.preventDefault();
          restart();
        }
        return;
      }

      // Zen: space/backspace flow into the input as normal characters;
      // Enter ends the session, Esc resets.
      if (state.zen) {
        switch (e.key) {
          case "Enter": {
            e.preventDefault();
            dispatch({ type: "END_ZEN", now: Date.now() });
            break;
          }
          case "Escape": {
            e.preventDefault();
            reset();
            break;
          }
          case "Tab": {
            e.preventDefault();
            tabPressedAtRef.current = Date.now();
            break;
          }
        }
        return;
      }

      switch (e.key) {
        case " ": {
          e.preventDefault();
          const settings = useSettingsStore.getState();
          if (settings.soundEnabled) {
            playClick(settings.soundPack, settings.volume / 100);
          }
          dispatch({ type: "SUBMIT_WORD", now: Date.now() });
          break;
        }
        case "Backspace": {
          if (state.typed[state.activeIndex] === "") {
            e.preventDefault();
            dispatch({ type: "BACK_TO_PREVIOUS_WORD" });
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          reset();
          break;
        }
        case "Tab": {
          e.preventDefault();
          tabPressedAtRef.current = Date.now();
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (Date.now() - tabPressedAtRef.current < 1000) restart();
          break;
        }
      }
    },
    [state.finished, state.zen, state.typed, state.activeIndex, restart, reset],
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const settings = useSettingsStore.getState();
    const zen = configRef.current.mode === "zen";
    const isBangla = configRef.current.language === "bangla";

    // Auto-convert input if Bangla mode is active
    if (isBangla) {
      if (settings.keyboardLayout === "bijoy") {
        value = bijoyConvert(value);
        e.target.value = value;
      } else {
        // Avro Phonetic
        value = avroPhonetic(value);
        e.target.value = value;
      }
    }

    // Compare the new input against the target word (per grapheme cluster,
    // so Bangla conjuncts are matched as one unit).
    let mismatch = false;
    if (!zen) {
      const word = stateRef.current.words[stateRef.current.activeIndex] ?? "";
      const target = splitGraphemes(word);
      const typed = splitGraphemes(value);
      mismatch = typed.some(
        (grapheme, i) => target[i] !== undefined && grapheme !== target[i],
      );
    }

    if (mismatch && settings.soundEnabled && settings.errorSound) {
      playError(settings.volume / 100);
    }

    // Stop on error: reject the keystroke by reverting the DOM value
    // directly (no re-render needed — state was not updated).
    if (mismatch && settings.stopOnError) {
      e.target.value =
        stateRef.current.typed[stateRef.current.activeIndex] ?? "";
      return;
    }

    if (settings.soundEnabled) {
      playClick(settings.soundPack, settings.volume / 100);
    }

    // Zen: spaces belong to the text, no word submission.
    if (zen) {
      dispatch({ type: "INPUT_CHANGE", value, now: Date.now() });
      return;
    }
    if (value.endsWith(" ")) {
      // Mobile keyboards often deliver space as input instead of keydown.
      dispatch({ type: "INPUT_CHANGE", value: value.slice(0, -1), now: Date.now() });
      dispatch({ type: "SUBMIT_WORD", now: Date.now() });
      return;
    }
    dispatch({ type: "INPUT_CHANGE", value, now: Date.now() });
  }, []);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const started = state.startedAt !== null;
  const elapsedMs = !started
    ? 0
    : state.finished
      ? (state.finishedAt as number) - (state.startedAt as number)
      : Math.max(0, now - (state.startedAt as number));

  const liveStats: LiveStats = {
    wpm: started ? calcWpm(totalCorrectChars(state), Math.max(elapsedMs, 1000)) : 0,
    accuracy: calcAccuracy(state),
    seconds: Math.floor(elapsedMs / 1000),
    remaining:
      state.timeLimitMs !== null && started && !state.finished
        ? Math.max(0, Math.ceil((state.timeLimitMs - elapsedMs) / 1000))
        : null,
    running: started && !state.finished,
  };

  const results: TypingResults | null =
    state.finished && state.finishedAt !== null
      ? computeResults(state, state.finishedAt)
      : null;

  const currentInput = state.typed[state.activeIndex] ?? "";

  return {
    state,
    currentInput,
    focused,
    inputRef,
    restart,
    reset,
    endZen,
    liveStats,
    results,
    inputProps: {
      value: currentInput,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
  };
}
