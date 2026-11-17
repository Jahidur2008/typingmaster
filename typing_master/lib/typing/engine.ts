/* ------------------------------------------------------------------ */
/*  Typing engine — pure state machine + calculations.                 */
/*  No React, no DOM: everything here is unit-testable.                */
/* ------------------------------------------------------------------ */

export type CharState = "correct" | "incorrect" | "extra" | "untyped";

/* ------------------------------------------------------------------ */
/*  Grapheme segmentation (Bangla-safe)                                */
/* ------------------------------------------------------------------ */

let graphemeSegmenter: Intl.Segmenter | undefined;
if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
  graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
}

/**
 * Split text into user-perceived characters. Bangla conjuncts (ক্ষ) and
 * vowel-marked clusters (কি) stay whole, so comparing and rendering per
 * cluster never breaks a conjunct apart — even when the keyboard or IME
 * emits the code points in a different order.
 */
export function splitGraphemes(text: string): string[] {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
  }
  // Fallback for engines without Intl.Segmenter: code points (imperfect
  // for combining marks, but never crashes).
  return Array.from(text);
}

export interface TypedChar {
  char: string;
  state: CharState;
}

export interface TypingEngineState {
  /** Original test words. */
  words: string[];
  /** What the user has typed for each word (parallel to `words`). */
  typed: string[];
  activeIndex: number;
  /** Set on the first keystroke. */
  startedAt: number | null;
  finishedAt: number | null;
  finished: boolean;
  /** Time limit in ms (time mode); null for word-count based modes. */
  timeLimitMs: number | null;
  /** Zen mode: no target text, spaces are characters, ends manually. */
  zen: boolean;

  /* Keystroke-history counters (backspaced chars still count). */
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  extraKeystrokes: number;
  spacesKeystrokes: number;

  /** Chars never typed when a word was submitted, per word. */
  missedPerWord: number[];

  /** Instantaneous per-second WPM samples, for consistency. */
  samples: number[];
  lastSampleAt: number | null;
  lastSampleCorrect: number;
  /** Cumulative raw keystrokes and errors at the last sample. */
  lastSampleRaw: number;
  lastSampleErrors: number;
  /** Per-second snapshot for the results graph. */
  history: Array<{
    second: number;
    wpm: number;
    rawWpm: number;
    errors: number;
  }>;
}

export function createEngineState(
  words: string[],
  options: { timeLimitMs?: number | null; zen?: boolean } = {},
): TypingEngineState {
  return {
    words,
    typed: words.map(() => ""),
    activeIndex: 0,
    startedAt: null,
    finishedAt: null,
    finished: false,
    timeLimitMs: options.timeLimitMs ?? null,
    zen: options.zen ?? false,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    extraKeystrokes: 0,
    spacesKeystrokes: 0,
    missedPerWord: words.map(() => 0),
    samples: [],
    lastSampleAt: null,
    lastSampleCorrect: 0,
    lastSampleRaw: 0,
    lastSampleErrors: 0,
    history: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Character inspection                                               */
/* ------------------------------------------------------------------ */

/**
 * Per-cluster state for a word. If `typed` has more grapheme clusters
 * than `word`, the surplus is reported as "extra" (shown with the
 * cluster the user actually typed). Bangla conjuncts stay whole.
 */
export function getCharStates(word: string, typed: string): TypedChar[] {
  const target = splitGraphemes(word);
  const got = splitGraphemes(typed);
  const n = Math.max(target.length, got.length);
  const out: TypedChar[] = [];
  for (let i = 0; i < n; i++) {
    const want = target[i];
    const have = got[i];
    if (have === undefined) {
      out.push({ char: want as string, state: "untyped" });
    } else if (want === undefined) {
      out.push({ char: have, state: "extra" });
    } else {
      out.push({ char: have, state: have === want ? "correct" : "incorrect" });
    }
  }
  return out;
}

/**
 * Standard WPM calculation relies on 1 word = 5 characters.
 * In Bangla, combining marks (কার, হসন্ত, ইত্যাদি) each represent distinct keystrokes.
 * Counting individual Unicode code points gives an accurate, standardized character
 * count that reflects true typing speed.
 */
function clusterCharWeight(cluster: string): number {
  if (!cluster) return 0;
  if (/[\u0980-\u09FF]/.test(cluster)) {
    return Array.from(cluster).length;
  }
  return 1;
}

function matchingGraphemes(word: string, typed: string): number {
  const target = splitGraphemes(word);
  const got = splitGraphemes(typed);
  const n = Math.min(target.length, got.length);
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (got[i] === target[i]) {
      count += clusterCharWeight(target[i]);
    }
  }
  return count;
}

/** A submitted word counts as erroneous if anything mismatches or overflows. */
export function wordHasErrors(word: string, typed: string): boolean {
  if (typed.length === 0) return false;
  return (
    typed.length > word.length ||
    splitGraphemes(typed).some((g, i) => splitGraphemes(word)[i] !== g)
  );
}

/** Correct clusters across all words up to (and including) the active one. */
export function totalCorrectChars(state: TypingEngineState): number {
  // Zen has no target text — every typed cluster counts.
  if (state.zen) {
    let count = 0;
    for (const cluster of splitGraphemes(state.typed[0] ?? "")) {
      count += clusterCharWeight(cluster);
    }
    return count;
  }
  let count = 0;
  for (let i = 0; i <= state.activeIndex && i < state.words.length; i++) {
    count += matchingGraphemes(state.words[i], state.typed[i]);
  }
  return count;
}

export function totalMissedChars(state: TypingEngineState): number {
  return state.missedPerWord.reduce((a, b) => a + b, 0);
}

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

export type TypingEngineAction =
  | { type: "INPUT_CHANGE"; value: string; now: number }
  | { type: "SUBMIT_WORD"; now: number }
  | { type: "BACK_TO_PREVIOUS_WORD" }
  | { type: "TICK"; now: number }
  | { type: "RESTART"; words: string[]; timeLimitMs?: number | null; zen?: boolean }
  | { type: "APPEND_WORDS"; words: string[] }
  | { type: "TIME_UP" }
  | { type: "END_ZEN"; now: number };

/** Count keystrokes for clusters added between two input values. */
function tallyInsertions(
  word: string,
  prev: string,
  next: string,
): { correct: number; incorrect: number; extra: number } {
  const target = splitGraphemes(word);
  const before = splitGraphemes(prev);
  const after = splitGraphemes(next);

  let prefix = 0;
  const maxCommon = Math.min(before.length, after.length);
  while (prefix < maxCommon && before[prefix] === after[prefix]) prefix++;

  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  for (let i = prefix; i < after.length; i++) {
    const weight = clusterCharWeight(after[i] || target[i] || "");
    if (i >= target.length) extra += weight;
    else if (after[i] === target[i]) correct += weight;
    else incorrect += weight;
  }
  return { correct, incorrect, extra };
}

export function typingEngineReducer(
  state: TypingEngineState,
  action: TypingEngineAction,
): TypingEngineState {
  switch (action.type) {
    case "RESTART":
      return createEngineState(action.words, {
        timeLimitMs: action.timeLimitMs ?? null,
        zen: action.zen ?? false,
      });

    case "APPEND_WORDS": {
      if (state.finished || state.zen || action.words.length === 0) return state;
      return {
        ...state,
        words: [...state.words, ...action.words],
        typed: [...state.typed, ...action.words.map(() => "")],
        missedPerWord: [...state.missedPerWord, ...action.words.map(() => 0)],
      };
    }

    case "TIME_UP": {
      if (
        state.finished ||
        state.startedAt === null ||
        state.timeLimitMs === null
      ) {
        return state;
      }
      // Finish at the exact limit so stats are not skewed by tick jitter.
      return {
        ...state,
        finished: true,
        finishedAt: state.startedAt + state.timeLimitMs,
      };
    }

    case "END_ZEN": {
      if (state.finished || state.startedAt === null) return state;
      return { ...state, finished: true, finishedAt: action.now };
    }

    case "INPUT_CHANGE": {
      if (state.finished) return state;
      const index = state.activeIndex;
      const prev = state.typed[index] ?? "";
      if (action.value === prev) return state;

      const typed = state.typed.slice();

      // Zen: no target, every inserted cluster is a correct keystroke.
      if (state.zen) {
        const before = splitGraphemes(prev);
        const after = splitGraphemes(action.value);
        let prefix = 0;
        const maxCommon = Math.min(before.length, after.length);
        while (prefix < maxCommon && before[prefix] === after[prefix]) prefix++;
        typed[index] = action.value;
        return {
          ...state,
          typed,
          startedAt: state.startedAt ?? action.now,
          correctKeystrokes: state.correctKeystrokes + (after.length - prefix),
        };
      }

      const delta = tallyInsertions(state.words[index] ?? "", prev, action.value);
      typed[index] = action.value;

      const isLast = index === state.words.length - 1;
      // Test ends when the final word is typed exactly (word-count modes only).
      const completesTest =
        state.timeLimitMs === null && isLast && action.value === state.words[index];

      return {
        ...state,
        typed,
        startedAt: state.startedAt ?? action.now,
        correctKeystrokes: state.correctKeystrokes + delta.correct,
        incorrectKeystrokes: state.incorrectKeystrokes + delta.incorrect,
        extraKeystrokes: state.extraKeystrokes + delta.extra,
        ...(completesTest ? { finished: true, finishedAt: action.now } : null),
      };
    }

    case "SUBMIT_WORD": {
      if (state.finished || state.zen) return state;
      const index = state.activeIndex;
      const typedNow = state.typed[index];
      if (!typedNow) return state; // empty word: nothing to submit

      const missedPerWord = state.missedPerWord.slice();
      missedPerWord[index] = Math.max(
        0,
        splitGraphemes(state.words[index] ?? "").length -
          splitGraphemes(typedNow).length,
      );

      const isLast = index === state.words.length - 1;
      // Only word-count based tests end on the last word; time mode keeps
      // running (words are appended as needed).
      const canAutoFinish = state.timeLimitMs === null;
      return {
        ...state,
        missedPerWord,
        spacesKeystrokes: state.spacesKeystrokes + 1,
        activeIndex: isLast ? index : index + 1,
        startedAt: state.startedAt ?? action.now,
        ...(canAutoFinish && isLast
          ? { finished: true, finishedAt: action.now }
          : null),
      };
    }

    case "BACK_TO_PREVIOUS_WORD": {
      if (state.finished) return state;
      if (state.activeIndex === 0) return state;
      if (state.typed[state.activeIndex] !== "") return state;
      return { ...state, activeIndex: state.activeIndex - 1 };
    }

    case "TICK": {
      if (!state.startedAt || state.finished) return state;
      const since = action.now - (state.lastSampleAt ?? state.startedAt);
      if (since <= 0) return state;

      const correctNow = totalCorrectChars(state);
      const rawNow =
        state.correctKeystrokes +
        state.incorrectKeystrokes +
        state.extraKeystrokes +
        state.spacesKeystrokes;
      const errorsNow = state.incorrectKeystrokes + state.extraKeystrokes;

      const charsThisSample = Math.max(0, correctNow - state.lastSampleCorrect);
      const rawThisSample = Math.max(0, rawNow - state.lastSampleRaw);
      const errorsThisSample = Math.max(0, errorsNow - state.lastSampleErrors);

      // Instantaneous WPM for this sample window.
      const rate = 60000 / since;
      return {
        ...state,
        samples: [...state.samples, (charsThisSample / 5) * rate],
        lastSampleAt: action.now,
        lastSampleCorrect: correctNow,
        lastSampleRaw: rawNow,
        lastSampleErrors: errorsNow,
        history: [
          ...state.history,
          {
            second: state.history.length + 1,
            wpm: (charsThisSample / 5) * rate,
            rawWpm: (rawThisSample / 5) * rate,
            errors: errorsThisSample,
          },
        ],
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Calculations (all pure, all in ms)                                 */
/* ------------------------------------------------------------------ */

export function calcWpm(correctChars: number, elapsedMs: number): number {
  const minutes = Math.max(elapsedMs, 1) / 60000;
  return correctChars / 5 / minutes;
}

/** Raw WPM counts every keystroke: correct, incorrect, extra and spaces. */
export function calcRawWpm(
  state: TypingEngineState,
  elapsedMs: number,
): number {
  const total =
    state.correctKeystrokes +
    state.incorrectKeystrokes +
    state.extraKeystrokes +
    state.spacesKeystrokes;
  return calcWpm(total, elapsedMs);
}

/** Accuracy over the keystroke history (fixing mistakes costs accuracy). */
export function calcAccuracy(state: TypingEngineState): number {
  const total =
    state.correctKeystrokes +
    state.incorrectKeystrokes +
    state.extraKeystrokes;
  if (total === 0) return 100;
  return (state.correctKeystrokes / total) * 100;
}

/**
 * Consistency from per-second WPM samples: 100 × (1 − coefficient of
 * variation), clamped to [0, 100] — the same metric Monkeytype uses.
 */
export function calcConsistency(samples: number[]): number {
  if (samples.length < 2) return 0;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 0;
  const variance =
    samples.reduce((sum, s) => sum + (s - mean) ** 2, 0) / samples.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, (1 - cv) * 100));
}

export function getElapsedMs(state: TypingEngineState, now: number): number {
  if (state.startedAt === null) return 0;
  const end = state.finishedAt ?? now;
  return Math.max(0, end - state.startedAt);
}

export interface WpmSample {
  second: number;
  wpm: number;
  rawWpm: number;
  /** Incorrect + extra keystrokes typed during that second. */
  errors: number;
}

export interface TypingResults {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  timeMs: number;
  chars: {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
  };
  /** Per-second series for the results graph. */
  history: WpmSample[];
}

export function computeResults(
  state: TypingEngineState,
  now: number,
): TypingResults {
  const elapsed = getElapsedMs(state, now);
  const correct = totalCorrectChars(state);
  return {
    wpm: calcWpm(correct, elapsed),
    rawWpm: calcRawWpm(state, elapsed),
    accuracy: calcAccuracy(state),
    consistency: calcConsistency(state.samples),
    timeMs: elapsed,
    history: state.history,
    chars: {
      correct,
      incorrect: state.incorrectKeystrokes,
      extra: state.extraKeystrokes,
      missed: totalMissedChars(state),
    },
  };
}
