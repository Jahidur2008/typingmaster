"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Flame,
  Lock,
  PenTool,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";
import {
  AchievementModal,
  type AchievementCelebration,
} from "@/components/gamification/achievement-modal";
import {
  formatCountdown,
  getLevelProgress,
  type BadgeItem,
  type ChallengeItem,
} from "@/lib/typing/gamification";
import { submitChallengeAttempt } from "@/lib/typing/history";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag: Award,
  Compass,
  Shield,
  Award,
  Crown,
  Zap,
  Flame,
  Sparkles,
  Target,
  Trophy,
  Calendar,
  PenTool,
};

export default function ChallengePage() {
  const { user, token, mongoUser, refreshMongoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"challenges" | "badges">("challenges");
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Runner State
  const [playingChallenge, setPlayingChallenge] = useState<ChallengeItem | null>(null);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [charErrors, setCharErrors] = useState<Record<number, boolean>>({});

  const runnerStartRef = useRef<number | null>(null);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Challenge completion status
  const [completedAttempt, setCompletedAttempt] = useState<{
    passed: boolean;
    wpm: number;
    accuracy: number;
    earnedXp: number;
  } | null>(null);

  // Celebration modal
  const [celebration, setCelebration] = useState<AchievementCelebration | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Fetch challenges and badges from server
  const loadData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [cRes, bRes] = await Promise.all([
        fetch(`${API_URL}/api/challenges`, { headers }),
        fetch(`${API_URL}/api/challenges/badges`, { headers }),
      ]);

      if (cRes.ok) {
        const cData = await cRes.json();
        setChallenges(cData.challenges || []);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBadges(bData.badges || []);
      }
    } catch (err) {
      console.warn("[challenge] Error loading challenges/badges:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // User Gamification stats
  const totalXp = mongoUser?.xp || 0;
  const levelProgress = useMemo(() => getLevelProgress(totalXp), [totalXp]);
  const streakInfo = mongoUser?.streak || { current: 0, best: 0 };
  const unlockedBadgesCount = useMemo(
    () => badges.filter((b) => b.unlocked).length,
    [badges],
  );

  // Start a challenge in the runner
  const startChallenge = (challenge: ChallengeItem) => {
    setPlayingChallenge(challenge);
    const words = challenge.text.trim().split(/\s+/);
    setTargetWords(words);
    setWordIdx(0);
    setTypedInput("");
    setCharErrors({});
    runnerStartRef.current = null;
    setCorrectChars(0);
    setIncorrectChars(0);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setCompletedAttempt(null);

    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const currentWord = targetWords[wordIdx] || "";

  // Live timer for runner
  useEffect(() => {
    if (!playingChallenge || completedAttempt) return;

    const interval = setInterval(() => {
      const start = runnerStartRef.current;
      if (!start) return;
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed > 0.5) {
        const wordsTyped = (correctChars + typedInput.length) / 5;
        const wpm = Math.round((wordsTyped / elapsed) * 60);
        setLiveWpm(Math.max(0, wpm));

        const totalAttempts = correctChars + incorrectChars;
        if (totalAttempts > 0) {
          setLiveAccuracy(Math.round((correctChars / totalAttempts) * 100));
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [playingChallenge, completedAttempt, correctChars, incorrectChars, typedInput.length]);

  // Handle typing input in challenge runner
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!runnerStartRef.current) runnerStartRef.current = Date.now();

    // Spacebar pressed to complete word
    if (val.endsWith(" ")) {
      const submitted = val.trim();
      let wordCorrect = 0;
      let wordIncorrect = 0;
      for (let i = 0; i < currentWord.length; i++) {
        if (submitted[i] === currentWord[i]) wordCorrect++;
        else wordIncorrect++;
      }
      if (submitted.length < currentWord.length) {
        wordIncorrect += currentWord.length - submitted.length;
      }

      setCorrectChars((c) => c + wordCorrect + 1); // +1 space
      setIncorrectChars((i) => i + wordIncorrect);

      if (wordIdx + 1 >= targetWords.length) {
        // Finished all words in challenge!
        handleChallengeFinish(wordCorrect, wordIncorrect);
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
      if (val[i] !== currentWord[i]) errors[i] = true;
    }
    setCharErrors(errors);
    setTypedInput(val);
  };

  // Submit challenge results
  const handleChallengeFinish = async (finalWordCorrect: number, finalWordIncorrect: number) => {
    const start = runnerStartRef.current || Date.now();
    const elapsedSec = Math.max(1, (Date.now() - start) / 1000);
    const finalCorrect = correctChars + finalWordCorrect;
    const finalIncorrect = incorrectChars + finalWordIncorrect;
    const finalWpm = Math.round(((finalCorrect / 5) / elapsedSec) * 60);
    const totalAttempts = finalCorrect + finalIncorrect;
    const finalAcc = totalAttempts > 0 ? Math.round((finalCorrect / totalAttempts) * 100) : 100;

    const targetWpm = playingChallenge?.targetWpm || 0;
    const targetAcc = playingChallenge?.targetAccuracy || 0;
    const passed = finalWpm >= targetWpm && finalAcc >= targetAcc;

    setCompletedAttempt({
      passed,
      wpm: finalWpm,
      accuracy: finalAcc,
      earnedXp: passed ? (playingChallenge?.xpReward || 0) : 0,
    });

    if (user && playingChallenge) {
      try {
        const idToken = await user.getIdToken();
        const res = await submitChallengeAttempt(
          playingChallenge._id,
          {
            wpm: finalWpm,
            accuracy: finalAcc,
            timeSeconds: Math.round(elapsedSec),
          },
          idToken,
        );

        refreshMongoUser();
        loadData();

        // Check if unlocked new badges or leveled up
        if (res.newBadges && res.newBadges.length > 0) {
          setCelebration({
            type: "badge",
            badge: res.newBadges[0],
          });
        } else if (res.leveledUp) {
          setCelebration({
            type: "level",
            level: res.user?.level,
          });
        }
      } catch (err) {
        console.warn("[challenge] Error submitting attempt:", err);
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <AmbientBackground />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
        {/* Top Header & Gamification Summary Bar */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-3 py-1 font-mono text-xs font-semibold text-main uppercase">
              <Swords className="h-3.5 w-3.5" />
              Gamification Arena
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Challenges & Achievements
            </h1>
            <p className="mt-1 text-sm text-subtext">
              Test your limits against daily global challenges, earn bonus XP, and unlock prestigious badges.
            </p>
          </div>

          {/* User Gamification Stats Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Level Card */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-subtext">
                <span className="font-mono">Rank</span>
                <Sparkles className="h-4 w-4 text-main" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 font-typing text-2xl font-bold text-text">
                Level {levelProgress.currentLevel}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-main transition-all duration-500"
                  style={{ width: `${levelProgress.progressPercent}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-subtext">
                <span>{levelProgress.currentProgressXp} XP</span>
                <span>{levelProgress.xpRemaining} needed</span>
              </div>
            </div>

            {/* Daily Streak Card */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-subtext">
                <span className="font-mono">Daily Streak</span>
                <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 font-typing text-2xl font-bold text-orange-400">
                {streakInfo.current}{" "}
                <span className="text-xs font-normal text-subtext">
                  {streakInfo.current === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="mt-3 font-mono text-[10px] text-subtext">
                Best streak: <strong className="text-text">{streakInfo.best || streakInfo.current} days</strong>
              </div>
            </div>

            {/* Badges Unlocked Card */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-subtext">
                <span className="font-mono">Achievements</span>
                <Trophy className="h-4 w-4 text-main" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5 font-typing text-2xl font-bold text-text">
                {unlockedBadgesCount} / {badges.length || 14}
              </div>
              <div className="mt-3 font-mono text-[10px] text-subtext">
                Total XP: <strong className="text-main">{totalXp} XP</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Challenges vs Badges */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("challenges")}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-2 font-mono text-xs font-semibold transition-all",
                activeTab === "challenges"
                  ? "border border-main/50 bg-main/15 text-main shadow-sm"
                  : "text-subtext hover:bg-surface hover:text-text",
              )}
            >
              Active Challenges ({challenges.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("badges")}
              className={cn(
                "cursor-pointer rounded-xl px-4 py-2 font-mono text-xs font-semibold transition-all",
                activeTab === "badges"
                  ? "border border-main/50 bg-main/15 text-main shadow-sm"
                  : "text-subtext hover:bg-surface hover:text-text",
              )}
            >
              Badges & Milestones ({unlockedBadgesCount}/{badges.length})
            </button>
          </div>

          <span className="hidden font-mono text-xs text-subtext sm:inline-block">
            Resets automatically at UTC midnight
          </span>
        </div>

        {/* VIEW 1: ACTIVE CHALLENGES */}
        {activeTab === "challenges" && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {challenges.map((c) => {
              const isDaily = c.type === "daily";
              const isWeekly = c.type === "weekly";
              const isSpeed = c.type === "speed";
              const isAccuracy = c.type === "accuracy";

              return (
                <div
                  key={c._id}
                  className={cn(
                    "relative flex flex-col justify-between rounded-3xl border bg-surface p-6 sm:p-7 shadow-xl transition-all duration-300 hover:border-main/50",
                    c.completed
                      ? "border-correct/40 bg-correct/5"
                      : "border-border",
                  )}
                >
                  {/* Top Header pill & countdown timer */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                            isDaily && "bg-main/20 text-main border border-main/40",
                            isWeekly && "bg-purple-500/20 text-purple-400 border border-purple-500/40",
                            isSpeed && "bg-blue-500/20 text-blue-400 border border-blue-500/40",
                            isAccuracy && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
                          )}
                        >
                          {c.type} Challenge
                        </span>
                        {c.completed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-correct/15 px-2 py-0.5 font-mono text-[10px] font-bold text-correct">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Countdown Timer */}
                      {(isDaily || isWeekly) && c.endsAt && (
                        <span className="flex items-center gap-1 font-mono text-xs text-subtext">
                          <Clock className="h-3.5 w-3.5" />
                          {formatCountdown(c.endsAt)}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-text">
                      {c.title}
                    </h2>
                    <p className="mt-1.5 text-xs text-subtext leading-relaxed">
                      {c.description}
                    </p>

                    {/* Target Objectives Box */}
                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface-2/60 p-3.5 font-mono text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-subtext/80">Target Speed</span>
                        <div className="mt-0.5 text-base font-bold text-text">
                          {c.targetWpm > 0 ? `${c.targetWpm} WPM` : "Any Speed"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-subtext/80">Target Accuracy</span>
                        <div className="mt-0.5 text-base font-bold text-text">
                          {c.targetAccuracy > 0 ? `${c.targetAccuracy}%` : "Any"}
                        </div>
                      </div>
                    </div>

                    {/* Rewards bar */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full border border-main/40 bg-main/15 px-2.5 py-0.5 font-bold text-main">
                        <Sparkles className="h-3 w-3" />
                        +{c.xpReward} XP
                      </span>
                      {c.badgeReward && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/40 bg-purple-500/15 px-2.5 py-0.5 text-purple-300">
                          <Award className="h-3 w-3" />
                          Badge: {c.badgeReward.name}
                        </span>
                      )}
                    </div>

                    {/* User stats if attempted */}
                    {c.attemptsCount !== undefined && c.attemptsCount > 0 && (
                      <div className="mt-3 font-mono text-[11px] text-subtext">
                        Your best: <strong className="text-text">{c.userBestWpm} WPM</strong> ({c.userBestAccuracy}% accuracy) · {c.attemptsCount} attempts
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <Button
                      onClick={() => startChallenge(c)}
                      className="w-full"
                      variant={c.completed ? "secondary" : "primary"}
                    >
                      <Play className="h-4 w-4" />
                      {c.completed ? "Play Again" : "Start Challenge"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: ACHIEVEMENTS & BADGES */}
        {activeTab === "badges" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => {
              const IconComp = b.icon && BADGE_ICONS[b.icon] ? BADGE_ICONS[b.icon] : Trophy;
              return (
                <div
                  key={b._id}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border p-5 transition-all",
                    b.unlocked
                      ? "border-main/50 bg-main/10 shadow-lg shadow-main/5"
                      : "border-border bg-surface-2/30 opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl",
                      b.unlocked
                        ? "border-main bg-main/20 text-main shadow-md shadow-main/20"
                        : "border-border bg-surface text-subtext",
                    )}
                  >
                    {b.unlocked ? (
                      <IconComp className="h-6 w-6 text-main" />
                    ) : (
                      <Lock className="h-5 w-5 text-subtext" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-text truncate">{b.name}</h4>
                      {b.unlocked ? (
                        <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-correct">
                          <CheckCircle2 className="h-3 w-3" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-subtext">Locked</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-subtext leading-relaxed">
                      {b.description}
                    </p>
                    <div className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] font-bold text-main">
                      <Sparkles className="h-2.5 w-2.5" />
                      +{b.xpReward} XP Reward
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CHALLENGE RUNNER MODAL */}
        {playingChallenge && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="rounded-full bg-main/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-main">
                    {playingChallenge.type} Challenge
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-text">
                    {playingChallenge.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingChallenge(null)}
                  className="rounded-lg p-2 text-subtext hover:bg-surface-2 hover:text-text cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Live Status Bar */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-4 py-3 font-mono text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase text-subtext">Live Speed:</span>
                    <div className="text-lg font-bold text-text">{liveWpm} WPM</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-subtext">Accuracy:</span>
                    <div className="text-lg font-bold text-text">{liveAccuracy}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-subtext">Goal:</span>
                  <div className="text-xs font-semibold text-main">
                    {playingChallenge.targetWpm} WPM · {playingChallenge.targetAccuracy}% Acc
                  </div>
                </div>
              </div>

              {/* Typing Stream Area */}
              {!completedAttempt ? (
                <div
                  className="relative min-h-[140px] rounded-2xl border border-border bg-bg/80 p-6 font-typing text-xl leading-relaxed cursor-text select-none"
                  onClick={() => inputRef.current?.focus()}
                >
                  <div className="flex flex-wrap gap-x-2.5 gap-y-2">
                    {targetWords.map((word, wIdx) => {
                      const isCurrent = wIdx === wordIdx;
                      const isDone = wIdx < wordIdx;

                      return (
                        <span
                          key={wIdx}
                          className={cn(
                            "relative inline-flex rounded px-1 transition-colors",
                            isDone && "text-text opacity-90",
                            isCurrent && "bg-main/10 ring-1 ring-main/30",
                            !isDone && !isCurrent && "text-subtext/50",
                          )}
                        >
                          {Array.from(word).map((char, cIdx) => {
                            let color = "text-subtext/50";
                            if (isDone) color = "text-text";
                            if (isCurrent) {
                              if (cIdx < typedInput.length) {
                                color = charErrors[cIdx] ? "text-error" : "text-text";
                              } else if (cIdx === typedInput.length) {
                                color = "text-main underline decoration-main decoration-2";
                              }
                            }

                            return (
                              <span key={cIdx} className={color}>
                                {char}
                              </span>
                            );
                          })}
                        </span>
                      );
                    })}
                  </div>

                  {/* Hidden Input Capture */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedInput}
                    onChange={handleInputChange}
                    autoFocus
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Challenge input"
                    className="absolute inset-0 h-full w-full opacity-0 cursor-default"
                  />
                </div>
              ) : (
                /* Completion Outcome Card */
                <div className="rounded-2xl border border-border bg-surface-2/40 p-6 text-center space-y-4">
                  <div
                    className={cn(
                      "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl shadow-lg",
                      completedAttempt.passed
                        ? "border-correct/40 bg-correct/20 text-correct shadow-correct/20"
                        : "border-error/40 bg-error/20 text-error shadow-error/20",
                    )}
                  >
                    {completedAttempt.passed ? (
                      <Trophy className="h-8 w-8" />
                    ) : (
                      <RotateCcw className="h-8 w-8" />
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-text">
                    {completedAttempt.passed
                      ? "Challenge Passed!"
                      : "Challenge Incomplete"}
                  </h3>

                  <p className="text-xs text-subtext max-w-md mx-auto">
                    {completedAttempt.passed
                      ? `Incredible! You hit ${completedAttempt.wpm} WPM with ${completedAttempt.accuracy}% accuracy, beating the challenge requirements.`
                      : `You achieved ${completedAttempt.wpm} WPM with ${completedAttempt.accuracy}% accuracy. Target was ${playingChallenge.targetWpm} WPM and ${playingChallenge.targetAccuracy}% accuracy.`}
                  </p>

                  <div className="flex items-center justify-center gap-6 pt-2 font-mono">
                    <div className="rounded-xl border border-border bg-surface px-4 py-2">
                      <span className="text-[10px] text-subtext uppercase">Your Speed</span>
                      <div className="text-xl font-bold text-text">{completedAttempt.wpm} WPM</div>
                    </div>
                    <div className="rounded-xl border border-border bg-surface px-4 py-2">
                      <span className="text-[10px] text-subtext uppercase">Accuracy</span>
                      <div className="text-xl font-bold text-text">{completedAttempt.accuracy}%</div>
                    </div>
                    {completedAttempt.earnedXp > 0 && (
                      <div className="rounded-xl border border-correct/40 bg-correct/15 px-4 py-2">
                        <span className="text-[10px] text-correct uppercase">Reward</span>
                        <div className="text-xl font-bold text-correct">+{completedAttempt.earnedXp} XP</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button onClick={() => startChallenge(playingChallenge)}>
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                    <Button variant="secondary" onClick={() => setPlayingChallenge(null)}>
                      Back to Challenges
                    </Button>
                  </div>
                </div>
              )}

              {!completedAttempt && (
                <div className="text-center font-mono text-[11px] text-subtext">
                  Type naturally · Space submits each word · Results verify automatically
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Celebration Modal for Badges and Level Up */}
        <AchievementModal
          celebration={celebration}
          onClose={() => setCelebration(null)}
        />
      </div>
    </div>
  );
}
