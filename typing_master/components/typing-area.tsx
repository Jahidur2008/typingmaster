"use client";

import { ConfigBar } from "@/components/config-bar";
import {
  AchievementModal,
  type AchievementCelebration,
} from "@/components/gamification/achievement-modal";
import { Keyboard } from "@/components/keyboard";
import { ResultsPanel, Stat } from "@/components/results-panel";
import { useAuth } from "@/lib/auth-context";
import { useSettingsStore } from "@/lib/store/settings";
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  type TypingConfig,
} from "@/lib/typing/config";
import {
  getCharStates,
  splitGraphemes,
  wordHasErrors,
  type CharState,
} from "@/lib/typing/engine";
import { saveGuestResult, submitResultToBackend } from "@/lib/typing/history";
import { recordResult } from "@/lib/typing/personal-bests";
import { useTypingEngine } from "@/lib/typing/use-typing-engine";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Flag, MousePointerClick, RotateCcw } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const ROW_GAP = 8; // must match gap-y-2 on the words container
const CARET_Y_OFFSET = 4;

interface TypingWordProps {
  word: string;
  typedStr: string;
  isActive: boolean;
  blindMode: boolean;
  charColors: Record<CharState, string>;
  wordIndex: number;
}

const TypingWord = memo(function TypingWord({
  word,
  typedStr,
  isActive,
  blindMode,
  charColors,
  wordIndex,
}: TypingWordProps) {
  const erroneous = !blindMode && !isActive && wordHasErrors(word, typedStr);
  const chars = getCharStates(word, typedStr);

  return (
    <span
      className={cn(
        "relative z-10 inline-flex whitespace-pre",
        erroneous &&
          "underline decoration-error/60 decoration-2 underline-offset-[6px]",
      )}
    >
      {chars.map((char, charIndex) => (
        <span
          key={charIndex}
          data-w={wordIndex}
          data-c={charIndex}
          className={charColors[char.state]}
        >
          {char.char}
        </span>
      ))}
    </span>
  );
});

export function TypingArea({ className }: { className?: string }) {
  // Whole-store subscription is fine here: settings change rarely and this
  // is the one component that consumes most of them.
  const settings = useSettingsStore();
  const { user, refreshMongoUser } = useAuth();

  const [config, setConfig] = useState<TypingConfig>(DEFAULT_CONFIG);
  const [customDraft, setCustomDraft] = useState("");
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "saving" | "saved" | "error" | null
  >(null);
  const [celebration, setCelebration] = useState<AchievementCelebration | null>(
    null,
  );
  const [windowHeight, setWindowHeight] = useState<number | null>(null);

  // Load the persisted config after mount (hydration-safe), persist on change.
  // The setState-in-effect pattern is intentional: reading localStorage during
  // the initial render would diverge from the server-rendered HTML.
  useEffect(() => {
    const stored = loadConfig();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfig(stored);
    setCustomDraft(stored.customText);
  }, []);
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const patchConfig = useCallback((patch: Partial<TypingConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
  }, []);

  const applyCustomText = useCallback(() => {
    setConfig((c) => ({
      ...c,
      mode: "custom",
      customText: customDraft.trim(),
    }));
  }, [customDraft]);

  // Blind mode: every character looks the same — no error feedback at all.
  const charColors: Record<CharState, string> = settings.blindMode
    ? {
        correct: "text-text",
        incorrect: "text-text",
        extra: "text-text",
        untyped: "text-text",
      }
    : {
        correct: "text-text",
        incorrect: "text-error",
        extra: "text-error/50",
        untyped: "text-subtext",
      };

  const {
    state,
    focused,
    inputRef,
    restart,
    reset,
    endZen,
    liveStats,
    results,
    inputProps,
  } = useTypingEngine(config);

  // Personal best + save result (cloud for authenticated users, localStorage for guests)
  const [newPB, setNewPB] = useState(false);
  const pbCheckRef = useRef(0);
  useEffect(() => {
    if (!results) {
      if (pbCheckRef.current !== 0) {
        // New test started — clear badge and state
        pbCheckRef.current = 0;
        setNewPB(false);
        setXpEarned(null);
        setSyncStatus(null);
      }
      return;
    }
    const checkId = state.finishedAt;
    if (checkId === null || pbCheckRef.current === checkId) return;
    pbCheckRef.current = checkId;

    async function handleSave() {
      if (user) {
        setSyncStatus("saving");
        try {
          const idToken = await user.getIdToken();
          const response = await submitResultToBackend(
            results!,
            config,
            idToken,
          );
          setNewPB(response.newPB);
          setXpEarned(response.xpEarned);
          setSyncStatus("saved");
          refreshMongoUser();

          // Check if new badges or level up earned
          if (response.newBadges && response.newBadges.length > 0) {
            setCelebration({
              type: "badge",
              badge: {
                _id: response.newBadges[0].slug,
                name: response.newBadges[0].name,
                slug: response.newBadges[0].slug,
                description: response.newBadges[0].description || "",
                icon: response.newBadges[0].icon,
                xpReward: response.newBadges[0].xpReward,
              },
            });
          } else if (response.user?.leveledUp) {
            setCelebration({
              type: "level",
              level: response.user.level,
            });
          }
        } catch (err) {
          console.warn(
            "[typing-area] Failed to post result to backend, falling back to local:",
            err,
          );
          const beaten = recordResult(config, {
            wpm: results!.wpm,
            rawWpm: results!.rawWpm,
            accuracy: results!.accuracy,
          });
          setNewPB(beaten);
          saveGuestResult(results!, config);
          setSyncStatus("error");
        }
      } else {
        const beaten = recordResult(config, {
          wpm: results!.wpm,
          rawWpm: results!.rawWpm,
          accuracy: results!.accuracy,
        });
        setNewPB(beaten);
        saveGuestResult(results!, config);
      }
    }

    handleSave();
  }, [results, config, user, state.finishedAt, refreshMongoUser]);

  const innerRef = useRef<HTMLDivElement | null>(null);
  const zenAnchorRef = useRef<HTMLSpanElement | null>(null);

  // Caret + line-scroll positions as motion values (no re-render churn).
  const caretX = useMotionValue(0);
  const caretY = useMotionValue(0);
  const scrollY = useMotionValue(0);
  const caretXSpring = useSpring(caretX, { stiffness: 600, damping: 45 });
  const caretYSpring = useSpring(caretY, { stiffness: 600, damping: 45 });
  const scrollYSpring = useSpring(scrollY, { stiffness: 400, damping: 40 });
  // Caret smoothing can be disabled for instant movement.
  const caretXView = settings.caretSmooth ? caretXSpring : caretX;
  const caretYView = settings.caretSmooth ? caretYSpring : caretY;

  const measureCaret = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const innerRect = inner.getBoundingClientRect();

    // Zen: the caret anchor sits right after the typed text.
    if (state.zen) {
      const anchor = zenAnchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      caretX.set(rect.left - innerRect.left);
      caretY.set(rect.top - innerRect.top + CARET_Y_OFFSET);
      // Line height follows the user's font settings.
      const css = getComputedStyle(inner);
      const lineHeight =
        parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.5;
      const line = Math.floor((rect.top - innerRect.top) / lineHeight);
      scrollY.set(-Math.max(0, line - 1) * lineHeight);
      const targetZenHeight = Math.ceil(lineHeight * 3 + ROW_GAP * 2 + 8);
      setWindowHeight((prev) => (prev === targetZenHeight ? prev : targetZenHeight));
      return;
    }

    const wordIndex = state.activeIndex;
    const typedStr = state.typed[wordIndex] ?? "";
    const word = state.words[wordIndex] ?? "";
    // Positions are grapheme-cluster indices, matching the rendered spans
    // (a Bangla conjunct is one span, not several code units).
    const position = splitGraphemes(typedStr).length;

    let rect = inner
      .querySelector<HTMLElement>(
        `[data-w="${wordIndex}"][data-c="${position}"]`,
      )
      ?.getBoundingClientRect();

    if (rect) {
      // Caret sits before the next cluster.
      caretX.set(rect.left - innerRect.left);
      caretY.set(rect.top - innerRect.top + CARET_Y_OFFSET);
    } else {
      // At the end of the word (or in extra chars): caret goes past the last one.
      const lastIndex =
        Math.max(splitGraphemes(word).length, splitGraphemes(typedStr).length) -
        1;
      const lastRect = inner
        .querySelector<HTMLElement>(
          `[data-w="${wordIndex}"][data-c="${lastIndex}"]`,
        )
        ?.getBoundingClientRect();
      if (!lastRect) return;
      caretX.set(lastRect.right - innerRect.left);
      caretY.set(lastRect.top - innerRect.top + CARET_Y_OFFSET);
      rect = lastRect;
    }

    const lineStep = rect.height + ROW_GAP;
    const line = Math.floor((rect.top - innerRect.top) / lineStep);
    scrollY.set(-Math.max(0, line - 1) * lineStep);

    // Calculate exact height needed for 3 full lines with safe descender buffer
    const targetWordsHeight = Math.ceil(lineStep * 2 + rect.height + 6);
    if (targetWordsHeight > 0) {
      setWindowHeight((prev) => (prev === targetWordsHeight ? prev : targetWordsHeight));
    }
  }, [
    state.activeIndex,
    state.typed,
    state.words,
    state.zen,
    caretX,
    caretY,
    scrollY,
  ]);

  useLayoutEffect(measureCaret, [measureCaret, state.typed, state.words]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const words = state.words;
  const finished = state.finished;
  const zen = state.zen;
  const running = liveStats.running;
  // Modes with a fixed word list show progress.
  const fixedWords =
    config.mode === "words" ||
    config.mode === "quote" ||
    config.mode === "custom";

  // Caret appearance (user-configurable). em/ch units scale with the
  // typing font size setting.
  const caretClass = {
    line: "h-[1.15em] w-[3px] rounded-full bg-main",
    block: "h-[1.15em] w-[1.05ch] rounded-[2px] bg-main/60",
    underline: "h-[3px] w-[1.05ch] translate-y-[1.05em] rounded-full bg-main",
    outline: "h-[1.15em] w-[1.05ch] rounded-[3px] border-2 border-main",
  }[settings.caretStyle];
  const typingStyle = {
    fontSize: "var(--typing-font-size, 1.75rem)",
    lineHeight: "var(--typing-line-height, 1.45)",
  } as const;

  return (
    <div className={cn("relative mx-auto w-full max-w-3xl", className)}>
      {/* Monkeytype-style config bar */}
      <ConfigBar
        config={config}
        onPatch={patchConfig}
        customDraft={customDraft}
        onCustomDraftChange={setCustomDraft}
        onApplyCustom={applyCustomText}
      />

      {/* Live stats + restart */}
      {!finished && (
        <div className="flex items-end justify-between px-1 pb-3">
          <div className="flex items-end gap-5 font-mono text-sm text-subtext">
            {config.mode === "time" ? (
              <span className="font-typing text-3xl leading-none text-main">
                {liveStats.remaining ?? config.timeSeconds}
              </span>
            ) : (
              <Stat label="time" value={`${liveStats.seconds}s`} />
            )}
            {!settings.hideLiveWpm && (
              <Stat
                label="wpm"
                value={running ? String(Math.round(liveStats.wpm)) : "–"}
                highlight={running}
              />
            )}
            <Stat
              label="acc"
              value={running ? `${Math.round(liveStats.accuracy)}%` : "–"}
            />
            {fixedWords && words.length > 0 && (
              <Stat
                label=""
                value={`${Math.min(state.activeIndex + 1, words.length)}/${words.length}`}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            {zen && running && (
              <button
                type="button"
                onClick={endZen}
                className="flex cursor-pointer items-center gap-1.5 font-mono text-xs text-subtext transition-colors hover:text-main"
              >
                <Flag className="h-4 w-4" />
                end test
              </button>
            )}
            <button
              type="button"
              onClick={restart}
              aria-label="Restart test"
              className="cursor-pointer text-subtext transition-colors hover:text-main"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!finished ? (
        <div className="relative">
          {zen ? (
            /* Zen: free typing, no target text */
            <div
              className="relative cursor-text overflow-hidden transition-[height] duration-150"
              style={{
                height: windowHeight
                  ? `${windowHeight}px`
                  : "calc(3 * var(--typing-font-size, 1.75rem) * var(--typing-line-height, 1.45) + 24px)",
              }}
              onClick={focusInput}
            >
              <motion.div
                ref={innerRef}
                style={{ y: scrollYSpring, ...typingStyle }}
                className="font-typing relative whitespace-pre-wrap text-text"
              >
                {state.typed[0] ?? ""}
                <span
                  ref={zenAnchorRef}
                  aria-hidden
                  className="inline-block w-0"
                />
                {/* Animated caret */}
                <motion.div
                  aria-hidden
                  className="absolute left-0 top-0 z-0"
                  style={{ x: caretXView, y: caretYView }}
                >
                  <span className={cn("block", caretClass)} />
                </motion.div>
              </motion.div>

              {!focused && (
                <button
                  type="button"
                  onClick={focusInput}
                  className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center gap-2 bg-bg/70 font-mono text-sm text-subtext backdrop-blur-[2px] transition-colors hover:text-text"
                >
                  <MousePointerClick className="h-4 w-4" />
                  click here to focus
                </button>
              )}
            </div>
          ) : (
            /* Words window */
            <div
              className="relative cursor-text overflow-hidden transition-[height] duration-150"
              style={{
                height: windowHeight
                  ? `${windowHeight}px`
                  : "calc(3 * var(--typing-font-size, 1.75rem) * var(--typing-line-height, 1.45) + 24px)",
              }}
              onClick={focusInput}
            >
              <motion.div
                ref={innerRef}
                style={{ y: scrollYSpring, ...typingStyle }}
                className="font-typing relative flex flex-wrap content-start gap-x-3 gap-y-2"
              >
                {words.map((word, wordIndex) => (
                  <TypingWord
                    key={wordIndex}
                    word={word}
                    typedStr={state.typed[wordIndex] ?? ""}
                    isActive={wordIndex === state.activeIndex}
                    blindMode={settings.blindMode}
                    charColors={charColors}
                    wordIndex={wordIndex}
                  />
                ))}

                {/* Animated caret */}
                <motion.div
                  aria-hidden
                  className="absolute left-0 top-0 z-0"
                  style={{ x: caretXView, y: caretYView }}
                >
                  <span className={cn("block", caretClass)} />
                </motion.div>
              </motion.div>

              {/* Focus overlay */}
              {!focused && (
                <button
                  type="button"
                  onClick={focusInput}
                  className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center gap-2 bg-bg/70 font-mono text-sm text-subtext backdrop-blur-[2px] transition-colors hover:text-text"
                >
                  <MousePointerClick className="h-4 w-4" />
                  click here to focus
                </button>
              )}
            </div>
          )}

          <p className="mt-3 text-center font-mono text-[11px] text-subtext/70">
            {zen
              ? "type freely · enter — end test · esc — reset"
              : "tab + enter — next test · esc — reset"}
          </p>

          {/* On-screen keyboard with keypress highlighting */}
          {settings.showKeyboard && (
            <Keyboard
              layoutId={
                config.language === "bangla"
                  ? settings.keyboardLayout === "bijoy"
                    ? "bijoy"
                    : "avro"
                  : settings.keyboardLayout
              }
              targetChar={
                splitGraphemes(state.typed[state.activeIndex] ?? "").length <
                splitGraphemes(state.words[state.activeIndex] ?? "").length
                  ? splitGraphemes(state.words[state.activeIndex] ?? "")[
                      splitGraphemes(state.typed[state.activeIndex] ?? "")
                        .length
                    ]
                  : " "
              }
              className="mt-5"
            />
          )}
        </div>
      ) : (
        results && (
          <ResultsPanel
            results={results}
            config={config}
            newPB={newPB}
            xpEarned={xpEarned}
            isGuest={!user}
            syncStatus={syncStatus}
            onNextTest={restart}
            onRestart={reset}
            onRepeatSame={reset}
          />
        )
      )}

      {/* Hidden input — holds focus and captures IME/mobile input */}
      <input
        ref={inputRef}
        {...inputProps}
        type="text"
        aria-label="Typing input"
        lang={config.language === "bangla" ? "bn" : "en"}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="pointer-events-none absolute left-1/2 top-0 h-px w-px -translate-x-1/2 opacity-0"
      />

      {/* Gamification Celebration Modal for Level Up and Badge Unlocks */}
      <AchievementModal
        celebration={celebration}
        onClose={() => setCelebration(null)}
      />
    </div>
  );
}
