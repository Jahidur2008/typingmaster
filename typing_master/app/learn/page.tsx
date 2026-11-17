"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Info,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AmbientBackground } from "@/components/ambient-background";
import { HandDiagram } from "@/components/learn/hand-diagram";
import { Keyboard } from "@/components/keyboard";
import { Button } from "@/components/ui/button";
import {
  getGuestLessonProgress,
  submitLessonComplete,
} from "@/lib/typing/learn-progress";
import { avroPhonetic } from "@/lib/typing/avro-phonetic";
import { bijoyConvert } from "@/lib/typing/bijoy";
import { useSettingsStore } from "@/lib/store/settings";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface LessonData {
  _id: string;
  course: string;
  title: string;
  description?: string;
  instructions?: string;
  content: string;
  targetWpm: number;
  targetAccuracy: number;
  order: number;
  unlocked?: boolean;
  completed?: boolean;
  userWpm?: number;
  userAccuracy?: number;
}

interface CourseData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  language?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  order: number;
  lessons: LessonData[];
}

export default function LearnPage() {
  const { user, token, refreshMongoUser } = useAuth();
  const keyboardLayout = useSettingsStore((s) => s.keyboardLayout);

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>("beginner-touch-typing");
  const [languageFilter, setLanguageFilter] = useState<"all" | "english" | "bangla">("all");
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);

  // Lesson player typing state
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [charErrors, setCharErrors] = useState<Record<number, boolean>>({});

  const drillStartRef = useRef<number | null>(null);
  const [correctCharCount, setCorrectCharCount] = useState(0);
  const [incorrectCharCount, setIncorrectCharCount] = useState(0);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [liveAcc, setLiveAcc] = useState(100);

  // Completion modal state
  const [isCompleted, setIsCompleted] = useState(false);
  const [passedLesson, setPassedLesson] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch courses from server and overlay local guest progress if needed
  const fetchCourses = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/courses`, { headers });
      if (res.ok) {
        const data = await res.json();
        const serverCourses: CourseData[] = data.courses || [];

        // If guest, overlay localStorage progress & calculate sequential unlocks
        if (!user) {
          const guestProgress = getGuestLessonProgress();
          let prevPassed = true; // first lesson unlocked by default

          serverCourses.forEach((c) => {
            c.lessons.forEach((l) => {
              const p = guestProgress[l._id];
              const completed = Boolean(p?.completed);
              l.unlocked = prevPassed;
              l.completed = completed;
              l.userWpm = p?.wpm || 0;
              l.userAccuracy = p?.accuracy || 0;
              prevPassed = completed;
            });
          });
        }

        setCourses(serverCourses);
        if (serverCourses.length > 0) {
          setSelectedCourseSlug((prev) => prev || serverCourses[0].slug);
        }
      }
    } catch (err) {
      console.warn("[learn] Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses();
  }, [fetchCourses]);

  // Active course
  const currentCourse = useMemo(() => {
    return courses.find((c) => c.slug === selectedCourseSlug) || courses[0];
  }, [courses, selectedCourseSlug]);

  // Overall lesson progress stats
  const totalLessons = useMemo(() => {
    return courses.reduce((acc, c) => acc + (c.lessons?.length || 0), 0);
  }, [courses]);

  const completedLessons = useMemo(() => {
    return courses.reduce(
      (acc, c) => acc + (c.lessons?.filter((l) => l.completed).length || 0),
      0,
    );
  }, [courses]);

  // Start a lesson
  const startLesson = (lesson: LessonData) => {
    setSelectedLesson(lesson);
    const words = lesson.content.trim().split(/\s+/);
    setTargetWords(words);
    setWordIdx(0);
    setTypedInput("");
    setCharErrors({});
    drillStartRef.current = null;
    setCorrectCharCount(0);
    setIncorrectCharCount(0);
    setLiveSpeed(0);
    setLiveAcc(100);
    setIsCompleted(false);
    setPassedLesson(false);
    setEarnedXp(0);

    setTimeout(() => inputRef.current?.focus(), 80);
  };

  // Current active character for hand diagram & keyboard
  const activeWord = targetWords[wordIdx] || "";
  const currentTargetChar =
    typedInput.length < activeWord.length
      ? activeWord[typedInput.length]
      : " "; // space to next word

  // Live Speed timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      const start = drillStartRef.current;
      if (!start) return;
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed > 0.5) {
        const words = (correctCharCount + typedInput.length) / 5;
        const wpm = Math.round((words / elapsed) * 60);
        setLiveSpeed(Math.max(0, wpm));

        const totalAttempts = correctCharCount + incorrectCharCount;
        if (totalAttempts > 0) {
          setLiveAcc(Math.round((correctCharCount / totalAttempts) * 100));
        }
      }
    }, 350);

    return () => clearInterval(interval);
  }, [isCompleted, correctCharCount, incorrectCharCount, typedInput.length]);

  // Handle typing inside lesson
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (currentCourse?.language === "bangla") {
      if (keyboardLayout === "bijoy") {
        val = bijoyConvert(val);
      } else {
        val = avroPhonetic(val);
      }
      e.target.value = val;
    }

    // eslint-disable-next-line react-hooks/purity
    if (!drillStartRef.current) drillStartRef.current = Date.now();

    // Spacebar pressed to complete word
    if (val.endsWith(" ")) {
      const submitted = val.trim();
      let wordCorrect = 0;
      let wordIncorrect = 0;
      for (let i = 0; i < activeWord.length; i++) {
        if (submitted[i] === activeWord[i]) wordCorrect++;
        else wordIncorrect++;
      }
      if (submitted.length < activeWord.length) {
        wordIncorrect += activeWord.length - submitted.length;
      }

      setCorrectCharCount((c) => c + wordCorrect + 1);
      setIncorrectCharCount((i) => i + wordIncorrect);

      if (wordIdx + 1 >= targetWords.length) {
        // Completed the drill!
        handleLessonFinish(wordCorrect, wordIncorrect);
      } else {
        setWordIdx((w) => w + 1);
        setTypedInput("");
        setCharErrors({});
      }
      return;
    }

    // Checking character errors
    const errors: Record<number, boolean> = {};
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== activeWord[i]) errors[i] = true;
    }
    setCharErrors(errors);
    setTypedInput(val);
  };

  const handleLessonFinish = async (finalCorrect: number, finalIncorrect: number) => {
    setIsCompleted(true);
    setSavingProgress(true);

    const elapsed = Math.max(1, (Date.now() - (drillStartRef.current || Date.now())) / 1000);
    const totalChars = correctCharCount + finalCorrect + 1;
    const finalWpm = Math.max(1, Math.round((totalChars / 5 / elapsed) * 60));
    const totalAttempts = totalChars + incorrectCharCount + finalIncorrect;
    const finalAccuracy = Math.round((totalChars / Math.max(1, totalAttempts)) * 100);

    const targetWpm = selectedLesson?.targetWpm || 15;
    const targetAccuracy = selectedLesson?.targetAccuracy || 90;
    const passed = finalAccuracy >= targetAccuracy && finalWpm >= targetWpm;

    setPassedLesson(passed);

    try {
      if (selectedLesson) {
        const result = await submitLessonComplete(
          selectedLesson._id,
          finalWpm,
          finalAccuracy,
          token,
        );

        if (passed) {
          setEarnedXp(result.xpEarned || 50);
          refreshMongoUser();
          // Update local state to unlock next lesson immediately
          await fetchCourses();
        }
      }
    } catch (err) {
      console.warn("[learn] Error saving progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <AmbientBackground />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-main border-t-transparent" />
        <p className="font-mono text-xs tracking-wider text-subtext uppercase">
          Loading touch typing courses...
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <AmbientBackground />

      <div className="relative w-full max-w-4xl space-y-8">
        {/* ======================================================== */}
        {/* VIEW 1: COURSE & LESSON BROWSER                          */}
        {/* ======================================================== */}
        {!selectedLesson ? (
          <>
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-3 py-1 font-mono text-xs font-semibold text-main uppercase">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Touch Typing Academy
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
                  Step-by-Step Typing Courses
                </h1>
                <p className="mt-1 text-sm text-subtext">
                  Master touch typing row by row with finger placement diagrams and live guidance.
                </p>
              </div>

              {/* Progress Pill */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-sm">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-main transition-all duration-500"
                    style={{
                      width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-xs font-semibold text-text">
                  {completedLessons} / {totalLessons} Lessons
                </span>
              </div>
            </div>

            {/* Language Filter Tabs */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="mr-2 text-subtext/70">Language:</span>
              <button
                type="button"
                onClick={() => setLanguageFilter("all")}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1 transition-colors",
                  languageFilter === "all"
                    ? "bg-main/20 font-bold text-main"
                    : "text-subtext hover:bg-surface-2 hover:text-text",
                )}
              >
                All Courses ({courses.length})
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("english")}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1 transition-colors",
                  languageFilter === "english"
                    ? "bg-main/20 font-bold text-main"
                    : "text-subtext hover:bg-surface-2 hover:text-text",
                )}
              >
                English ({courses.filter((c) => c.language === "english").length})
              </button>
              <button
                type="button"
                onClick={() => setLanguageFilter("bangla")}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1 font-bangla transition-colors",
                  languageFilter === "bangla"
                    ? "bg-main/20 font-bold text-main"
                    : "text-subtext hover:bg-surface-2 hover:text-text",
                )}
              >
                বাংলা ({courses.filter((c) => c.language === "bangla").length})
              </button>
            </div>

            {/* Course Difficulty Selector Tabs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {courses
                .filter((c) => languageFilter === "all" || c.language === languageFilter)
                .map((c) => {
                  const isSelected = c.slug === selectedCourseSlug;
                  const completedCount = c.lessons.filter((l) => l.completed).length;

                  return (
                    <button
                      key={c._id}
                      onClick={() => setSelectedCourseSlug(c.slug)}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-5 text-left transition-all duration-200",
                        isSelected
                          ? "border-main bg-surface shadow-lg shadow-main/5 ring-1 ring-main/30"
                          : "border-border bg-surface-2/40 hover:border-border hover:bg-surface-2",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                              c.language === "bangla"
                                ? "bg-main/20 text-main"
                                : "bg-surface-2 text-subtext",
                            )}
                          >
                            {c.language === "bangla" ? "বাংলা" : "EN"}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                              c.difficulty === "beginner"
                                ? "bg-correct/15 text-correct"
                                : c.difficulty === "intermediate"
                                  ? "bg-main/20 text-main"
                                  : "bg-error/15 text-error",
                            )}
                          >
                            {c.difficulty}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-subtext">
                          {completedCount}/{c.lessons.length} Done
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-semibold text-text">
                        {c.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-subtext">
                        {c.description}
                      </p>
                    </button>
                  );
                })}
            </div>

            {/* Lessons List in Active Course */}
            {currentCourse && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-text">
                      {currentCourse.title}
                    </h2>
                    <p className="text-xs text-subtext">
                      Complete each lesson with at least 90% accuracy and the target speed to unlock the next.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {currentCourse.lessons.map((lesson, idx) => {
                    const isUnlocked = lesson.unlocked;
                    const isDone = lesson.completed;

                    return (
                      <div
                        key={lesson._id}
                        className={cn(
                          "flex flex-col items-start justify-between gap-4 rounded-xl border p-4.5 transition-all sm:flex-row sm:items-center",
                          isDone
                            ? "border-correct/30 bg-surface/90 hover:border-correct/50"
                            : isUnlocked
                              ? "border-border bg-surface hover:border-main/50 shadow-sm"
                              : "border-border/60 bg-surface-2/20 opacity-60",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* Number badge */}
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold",
                              isDone
                                ? "bg-correct/15 text-correct"
                                : isUnlocked
                                  ? "bg-main/20 text-main"
                                  : "bg-surface-2 text-subtext",
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : isUnlocked ? (
                              `#${idx + 1}`
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-text text-sm sm:text-base">
                                {lesson.title}
                              </h3>
                              {isDone && (
                                <span className="rounded bg-correct/15 px-2 py-0.5 font-mono text-[10px] font-bold text-correct">
                                  PASSED
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-subtext">
                              {lesson.description}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-subtext">
                              <span>Target: <strong>{lesson.targetWpm} WPM</strong></span>
                              <span>•</span>
                              <span>Accuracy: <strong>&ge;{lesson.targetAccuracy}%</strong></span>
                              {isDone && lesson.userWpm ? (
                                <>
                                  <span>•</span>
                                  <span className="text-main">
                                    Best: {lesson.userWpm} WPM ({lesson.userAccuracy}%)
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="self-end sm:self-auto shrink-0">
                          {isUnlocked ? (
                            <Button
                              size="sm"
                              variant={isDone ? "secondary" : "primary"}
                              onClick={() => startLesson(lesson)}
                            >
                              <Play className="h-3.5 w-3.5" />
                              {isDone ? "Practice Again" : "Start Lesson"}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-subtext">
                              <Lock className="h-3.5 w-3.5" />
                              Locked
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ======================================================== */
          /* VIEW 2: INTERACTIVE LESSON PLAYER                        */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs text-subtext transition-colors hover:text-text"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Lessons
              </button>

              <div className="flex items-center gap-3 font-mono text-xs text-subtext">
                <span>
                  Goal: <strong className="text-text">{selectedLesson.targetWpm} WPM</strong>
                </span>
                <span>•</span>
                <span>
                  Acc: <strong className="text-text">&ge;{selectedLesson.targetAccuracy}%</strong>
                </span>
              </div>
            </div>

            {/* Instructions Banner */}
            <div className="rounded-2xl border border-main/30 bg-main/10 p-5">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-main shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-text text-sm">
                    {selectedLesson.title} — Lesson Instructions
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-text/90">
                    {selectedLesson.instructions}
                  </p>
                </div>
              </div>
            </div>

            {/* Hand Placement Diagram */}
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
              <div className="mb-2 text-center font-mono text-xs tracking-wider text-subtext uppercase">
                Finger Placement Guide
              </div>
              <HandDiagram targetChar={!isCompleted ? currentTargetChar : null} />
            </div>

            {/* Live Lesson Typing Area */}
            <div
              className="relative rounded-2xl border border-border bg-surface p-6 shadow-xl cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              {/* Stats Bar */}
              <div className="mb-6 flex items-center justify-between border-b border-border pb-3 font-mono text-xs text-subtext">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] tracking-wider uppercase text-subtext/70 block">
                      Live WPM
                    </span>
                    <span className="font-typing text-2xl font-bold text-main">
                      {liveSpeed}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider uppercase text-subtext/70 block">
                      Accuracy
                    </span>
                    <span className="font-typing text-2xl font-bold text-text">
                      {liveAcc}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] tracking-wider uppercase text-subtext/70 block">
                    Progress
                  </span>
                  <span className="font-mono text-sm text-text">
                    Word {Math.min(wordIdx + 1, targetWords.length)} / {targetWords.length}
                  </span>
                </div>
              </div>

              {/* Drill Words */}
              <div className="font-typing relative min-h-[90px] text-2xl leading-relaxed sm:text-3xl">
                <div className="flex flex-wrap gap-x-3.5 gap-y-2">
                  {targetWords.map((word, wIndex) => {
                    const isCurrent = wIndex === wordIdx;
                    const isPast = wIndex < wordIdx;

                    return (
                      <span
                        key={wIndex}
                        className={cn(
                          "relative inline-block transition-colors rounded px-1",
                          isCurrent && "bg-surface-2/60",
                          isPast && "text-subtext/60",
                        )}
                      >
                        {word.split("").map((ch, cIndex) => {
                          let color = "text-subtext";
                          if (isCurrent) {
                            if (cIndex < typedInput.length) {
                              color = charErrors[cIndex] ? "text-error" : "text-text";
                            } else if (cIndex === typedInput.length) {
                              color = "text-main underline underline-offset-4 font-bold";
                            }
                          } else if (isPast) {
                            color = "text-subtext/60";
                          }

                          return (
                            <span key={cIndex} className={color}>
                              {ch}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })}
                </div>

                {/* Input capture */}
                <input
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={handleInput}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Lesson typing input"
                  className="absolute inset-0 h-full w-full opacity-0 cursor-default"
                />
              </div>

              <div className="mt-4 border-t border-border pt-3 text-center font-mono text-[11px] text-subtext/70">
                keep your eyes on the screen · feel the bumps on F & J · space submits word
              </div>
            </div>

            {/* On-screen Interactive Keyboard with Next Key Highlight */}
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-subtext">
                <span>Interactive Keyboard</span>
                {currentTargetChar && (
                  <span>
                    Next: <strong className="text-main">{currentTargetChar === " " ? "SPACE" : currentTargetChar}</strong>
                  </span>
                )}
              </div>
              <Keyboard
                layoutId={
                  currentCourse?.language === "bangla"
                    ? keyboardLayout === "bijoy"
                      ? "bijoy"
                      : "avro"
                    : keyboardLayout
                }
                targetChar={!isCompleted ? currentTargetChar : null}
              />
            </div>

            {/* Lesson Completion Modal */}
            {isCompleted && (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
              >
                <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl text-center sm:p-8 space-y-4">
                  {passedLesson ? (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-main/40 bg-main/15 text-main">
                        <Trophy className="h-8 w-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-text">Lesson Passed!</h2>
                      <p className="text-xs text-subtext">
                        Congratulations! You met the accuracy and speed requirements to unlock the next lesson.
                      </p>
                      {earnedXp > 0 && (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-correct/40 bg-correct/15 px-3.5 py-1 font-mono text-xs font-bold text-correct">
                          <Sparkles className="h-3.5 w-3.5" />
                          +{earnedXp} XP Awarded
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-error/40 bg-error/15 text-error">
                        <RotateCcw className="h-8 w-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-text">Keep Practicing!</h2>
                      <p className="text-xs text-subtext">
                        Touch typing requires at least <strong>90% accuracy</strong> and <strong>{selectedLesson.targetWpm} WPM</strong> to advance.
                      </p>
                    </>
                  )}

                  {/* Stat comparison */}
                  <div className="grid grid-cols-2 gap-3 border-y border-border py-4 font-mono text-xs">
                    <div className="rounded-lg bg-surface-2/60 p-3">
                      <span className="text-subtext block text-[10px] uppercase">Speed</span>
                      <span className="font-typing text-2xl font-bold text-main">
                        {liveSpeed} <span className="text-xs font-normal">WPM</span>
                      </span>
                      <span className="block text-[10px] text-subtext mt-1">
                        Target: {selectedLesson.targetWpm} WPM
                      </span>
                    </div>

                    <div className="rounded-lg bg-surface-2/60 p-3">
                      <span className="text-subtext block text-[10px] uppercase">Accuracy</span>
                      <span
                        className={cn(
                          "font-typing text-2xl font-bold",
                          liveAcc >= (selectedLesson.targetAccuracy || 90)
                            ? "text-correct"
                            : "text-error",
                        )}
                      >
                        {liveAcc}%
                      </span>
                      <span className="block text-[10px] text-subtext mt-1">
                        Target: &ge;{selectedLesson.targetAccuracy || 90}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
                    <Button
                      variant={passedLesson ? "secondary" : "primary"}
                      onClick={() => startLesson(selectedLesson)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>

                    {passedLesson ? (
                      <Button
                        disabled={savingProgress}
                        onClick={() => {
                          // Find next lesson
                          const allLessons = currentCourse?.lessons || [];
                          const currentIdx = allLessons.findIndex(
                            (l) => l._id === selectedLesson._id,
                          );
                          if (currentIdx !== -1 && currentIdx + 1 < allLessons.length) {
                            startLesson(allLessons[currentIdx + 1]);
                          } else {
                            setSelectedLesson(null);
                          }
                        }}
                      >
                        {savingProgress ? "Saving..." : "Next Lesson"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
                        Back to Lessons
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
