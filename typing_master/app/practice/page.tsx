"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Dumbbell,
  Keyboard as KeyboardIcon,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AmbientBackground } from "@/components/ambient-background";
import { Keyboard } from "@/components/keyboard";
import { Button } from "@/components/ui/button";
import {
  generatePracticeWords,
  getDetectedWeakKeys,
  type PracticeMode,
} from "@/lib/typing/practice-generator";
import { cn } from "@/lib/utils";

const PRACTICE_MODES: Array<{ id: PracticeMode; label: string; desc: string }> = [
  { id: "home", label: "Home Row", desc: "A S D F — J K L ; (anchor keys & rests)" },
  { id: "top", label: "Top Row", desc: "Q W E R T Y U I O P (upper finger reach)" },
  { id: "bottom", label: "Bottom Row", desc: "Z X C V B N M (lower row extensions)" },
  { id: "numbers", label: "Numbers", desc: "1 2 3 4 5 6 7 8 9 0 (number row navigation)" },
  { id: "symbols", label: "Symbols", desc: "! @ # $ % & * ( ) _ + (punctuation & code)" },
  { id: "individual", label: "Individual Key", desc: "Drill any specific key with neighboring words" },
  { id: "weak", label: "Weak Keys", desc: "Auto-targeted exercises based on your past mistakes" },
];

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

const DEFAULT_PRACTICE_WORDS = [
  "all", "fall", "shall", "glad", "flash", "flags", "salad", "half", "glass",
  "dash", "salsa", "flask", "gala", "ask", "had", "has", "dad", "sad", "fad",
  "lad", "fads", "lads", "alas", "slash", "gas",
];

export default function PracticePage() {
  const [mode, setMode] = useState<PracticeMode>("home");
  const [wordCount, setWordCount] = useState<number>(25);
  const [selectedKey, setSelectedKey] = useState<string>("e");
  const [weakKeys, setWeakKeys] = useState<string[]>(["z", "x", "q", "p", "b", "c"]);

  // Drill words and typing state
  const [words, setWords] = useState<string[]>(DEFAULT_PRACTICE_WORDS);
  const [wordIndex, setWordIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [charErrors, setCharErrors] = useState<Record<number, boolean>>({});

  // Performance tracking
  const [startTime, setStartTime] = useState<number | null>(null);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [finished, setFinished] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Helper to reset drill state
  const resetDrillState = useCallback((newWords: string[]) => {
    setWords(newWords);
    setWordIndex(0);
    setInputVal("");
    setCharErrors({});
    setStartTime(null);
    setCorrectChars(0);
    setIncorrectChars(0);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setFinished(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Load new drill
  const initDrill = useCallback(
    (targetMode: PracticeMode, targetKey = selectedKey, targetWords = wordCount) => {
      let currentWeak = weakKeys;
      if (typeof window !== "undefined" && targetMode === "weak") {
        currentWeak = getDetectedWeakKeys();
        setWeakKeys(currentWeak);
      }
      const generated = generatePracticeWords(targetMode, targetWords, {
        individualKey: targetKey,
        weakKeys: currentWeak,
      });
      resetDrillState(generated);
    },
    [selectedKey, wordCount, weakKeys, resetDrillState],
  );

  // Client-side initialization on mount: randomize words and detect weak keys without infinite loops
  useEffect(() => {
    inputRef.current?.focus();
    const detected = getDetectedWeakKeys();
    const timer = setTimeout(() => {
      setWeakKeys(detected);
      setWords(generatePracticeWords("home", 25, { weakKeys: detected }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const switchMode = (newMode: PracticeMode) => {
    setMode(newMode);
    initDrill(newMode, selectedKey, wordCount);
  };

  const switchKey = (newKey: string) => {
    setSelectedKey(newKey);
    initDrill("individual", newKey, wordCount);
  };

  const switchWordCount = (newCount: number) => {
    setWordCount(newCount);
    initDrill(mode, selectedKey, newCount);
  };

  // Current target word and char
  const currentWord = words[wordIndex] || "";
  const nextTargetChar =
    inputVal.length < currentWord.length
      ? currentWord[inputVal.length]
      : " "; // spacebar needed to proceed

  // Live WPM timer
  useEffect(() => {
    if (!startTime || finished) return;
    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      if (elapsedSec > 0.5) {
        const wordsTyped = (correctChars + inputVal.length) / 5;
        const wpm = Math.round((wordsTyped / elapsedSec) * 60);
        setLiveWpm(Math.max(0, wpm));

        const totalAttempts = correctChars + incorrectChars;
        if (totalAttempts > 0) {
          setLiveAccuracy(Math.round((correctChars / totalAttempts) * 100));
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [startTime, finished, correctChars, incorrectChars, inputVal.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!startTime) setStartTime(Date.now());

    // If space pressed at the end of word or matches current word
    if (val.endsWith(" ")) {
      const submitted = val.trim();

      let wordCorrect = 0;
      let wordIncorrect = 0;
      for (let i = 0; i < currentWord.length; i++) {
        if (submitted[i] === currentWord[i]) {
          wordCorrect++;
        } else {
          wordIncorrect++;
        }
      }
      if (submitted.length < currentWord.length) {
        wordIncorrect += currentWord.length - submitted.length;
      }

      setCorrectChars((c) => c + wordCorrect + 1); // +1 for correct space
      setIncorrectChars((i) => i + wordIncorrect);

      if (wordIndex + 1 >= words.length) {
        // Finished drill!
        setFinished(true);
      } else {
        setWordIndex((w) => w + 1);
        setInputVal("");
        setCharErrors({});
      }
      return;
    }

    // Checking errors for individual characters
    const errors: Record<number, boolean> = {};
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== currentWord[i]) {
        errors[i] = true;
      }
    }
    setCharErrors(errors);
    setInputVal(val);
  };

  const currentDesc = PRACTICE_MODES.find((m) => m.id === mode)?.desc;

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <AmbientBackground />

      <div className="relative w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-3 py-1 font-mono text-xs font-semibold text-main uppercase">
            <Dumbbell className="h-3.5 w-3.5" />
            Targeted Typing Practice
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Key & Row Drills
          </h1>
          <p className="mt-1 text-sm text-subtext">
            Strengthen finger dexterity, eliminate weak keystrokes, and practice keyboard zones.
          </p>
        </div>

        {/* Practice Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2">
          {PRACTICE_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={cn(
                "cursor-pointer rounded-lg px-3.5 py-2 font-mono text-xs font-medium transition-all duration-150",
                mode === m.id
                  ? "bg-main font-semibold text-bg shadow-sm"
                  : "text-subtext hover:bg-surface-2 hover:text-text",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Mode Specific Controls Banner */}
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-3 sm:flex-row sm:items-center">
          <div className="text-xs">
            <span className="font-semibold text-text">Focus: </span>
            <span className="text-subtext">{currentDesc}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Word count selector */}
            <div className="flex items-center gap-1 font-mono text-xs text-subtext">
              <span>Words:</span>
              {[15, 25, 40].map((count) => (
                <button
                  key={count}
                  onClick={() => switchWordCount(count)}
                  className={cn(
                    "rounded px-2 py-0.5 transition-colors cursor-pointer",
                    wordCount === count ? "bg-main/20 font-bold text-main" : "hover:text-text",
                  )}
                >
                  {count}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => initDrill(mode, selectedKey, wordCount)}
              className="flex cursor-pointer items-center gap-1 font-mono text-xs text-subtext hover:text-main"
              aria-label="Restart drill"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Mode Options: Individual Key Picker */}
        {mode === "individual" && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between font-mono text-xs text-subtext">
              <span>Click any key below to drill specifically:</span>
              <span className="text-main font-semibold">Active: &apos;{selectedKey.toUpperCase()}&apos;</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALPHABET.map((k) => (
                <button
                  key={k}
                  onClick={() => switchKey(k)}
                  className={cn(
                    "flex h-8 w-8 cursor-pointer items-center justify-center rounded border font-mono text-xs uppercase transition-colors",
                    selectedKey === k
                      ? "border-main bg-main font-bold text-bg shadow-sm"
                      : "border-border bg-surface-2 text-text hover:border-main/50",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Options: Weak Keys Detected */}
        {mode === "weak" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-main/30 bg-main/10 p-4 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-main shrink-0" />
              <span>
                Targeting keys where you slip most:
              </span>
              <div className="flex items-center gap-1 font-mono font-bold uppercase text-main">
                {weakKeys.map((k) => (
                  <span
                    key={k}
                    className="inline-block rounded border border-main/40 bg-main/20 px-2 py-0.5"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <span className="font-mono text-[11px] text-subtext">
              Updated from your recent test errors
            </span>
          </div>
        )}

        {/* Live Typing Drill Area */}
        <div
          className="relative rounded-2xl border border-border bg-surface p-6 shadow-xl cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Top Live Stats Bar */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-3 font-mono text-xs text-subtext">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-subtext/70 block">
                  Speed
                </span>
                <span className="font-typing text-2xl font-bold text-main">
                  {liveWpm} <span className="text-xs font-normal text-subtext">wpm</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] tracking-wider uppercase text-subtext/70 block">
                  Accuracy
                </span>
                <span className="font-typing text-2xl font-bold text-text">
                  {liveAccuracy}%
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] tracking-wider uppercase text-subtext/70 block">
                Progress
              </span>
              <span className="font-mono text-sm text-text">
                Word {Math.min(wordIndex + 1, words.length)} / {words.length}
              </span>
            </div>
          </div>

          {!finished ? (
            /* Words Container */
            <div className="font-typing relative min-h-[110px] text-2xl leading-relaxed sm:text-3xl">
              <div className="flex flex-wrap gap-x-3.5 gap-y-2">
                {words.map((word, wIdx) => {
                  const isCurrent = wIdx === wordIndex;
                  const isPast = wIdx < wordIndex;

                  return (
                    <span
                      key={wIdx}
                      className={cn(
                        "relative inline-block transition-colors rounded px-1",
                        isCurrent && "bg-surface-2/60",
                        isPast && "text-subtext/60",
                      )}
                    >
                      {word.split("").map((ch, cIdx) => {
                        let colorClass = "text-subtext";
                        if (isCurrent) {
                          if (cIdx < inputVal.length) {
                            colorClass = charErrors[cIdx] ? "text-error" : "text-text";
                          } else if (cIdx === inputVal.length) {
                            colorClass = "text-main underline underline-offset-4 font-bold";
                          }
                        } else if (isPast) {
                          colorClass = "text-subtext/60";
                        }

                        return (
                          <span key={cIdx} className={colorClass}>
                            {ch}
                          </span>
                        );
                      })}
                    </span>
                  );
                })}
              </div>

              {/* Hidden capture input */}
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Typing drill input"
                className="absolute inset-0 h-full w-full opacity-0 cursor-default"
              />
            </div>
          ) : (
            /* Completion Card */
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-correct/15 text-correct">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-text">Drill Completed!</h2>
              <p className="text-xs text-subtext">
                Great job reinforcing your finger muscle memory.
              </p>

              <div className="mx-auto flex max-w-sm justify-center gap-8 border-y border-border py-4 font-mono">
                <div>
                  <div className="font-typing text-4xl font-bold text-main">{liveWpm}</div>
                  <div className="text-[11px] text-subtext uppercase">WPM</div>
                </div>
                <div>
                  <div className="font-typing text-4xl font-bold text-text">{liveAccuracy}%</div>
                  <div className="text-[11px] text-subtext uppercase">Accuracy</div>
                </div>
                <div>
                  <div className="font-typing text-4xl font-bold text-subtext">
                    {correctChars}
                  </div>
                  <div className="text-[11px] text-subtext uppercase">Chars Hit</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button onClick={() => initDrill(mode, selectedKey, wordCount)}>
                  <RefreshCw className="h-4 w-4" />
                  Practice Again
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const nextModeIndex =
                      (PRACTICE_MODES.findIndex((m) => m.id === mode) + 1) %
                      PRACTICE_MODES.length;
                    switchMode(PRACTICE_MODES[nextModeIndex].id);
                  }}
                >
                  Next Mode
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-3 text-center font-mono text-[11px] text-subtext/70">
            type the words · space proceeds to next word · esc restarts drill
          </div>
        </div>

        {/* Live Interactive Keyboard Highlighting the Next Key */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-subtext">
            <span className="flex items-center gap-1.5">
              <KeyboardIcon className="h-4 w-4 text-main" />
              Next Key Highlight
            </span>
            {nextTargetChar && (
              <span>
                Target: <span className="font-bold text-main">{nextTargetChar === " " ? "SPACEBAR" : nextTargetChar}</span>
              </span>
            )}
          </div>

          <Keyboard
            targetChar={!finished ? nextTargetChar : null}
            selectedKey={mode === "individual" ? selectedKey : null}
            onKeyClick={mode === "individual" ? (key) => switchKey(key.toLowerCase()) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
