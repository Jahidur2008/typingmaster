"use client";

import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ChevronRight,
  LogIn,
  Repeat,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { TypingResults } from "@/lib/typing/engine";
import type { TypingConfig } from "@/lib/typing/config";
import { testTypeLabel } from "@/lib/typing/personal-bests";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WpmChart = dynamic(
  () => import("@/components/wpm-chart").then((m) => m.WpmChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 w-full rounded-2xl bg-surface-2/40 animate-pulse flex items-center justify-center font-mono text-xs text-subtext">
        Rendering typing curve...
      </div>
    ),
  },
);

const container: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, duration: 0.4, ease: "easeOut" },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span>{label}</span>
      <span
        className={cn(
          "min-w-[3ch] text-text",
          highlight && "text-main",
        )}
      >
        {value}
      </span>
    </span>
  );
}

function BigStat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <motion.div variants={item} className="text-center sm:text-left">
      <div className="font-typing text-6xl leading-none font-bold text-main sm:text-7xl">
        {Math.round(value)}
        {suffix && <span className="text-3xl text-subtext">{suffix}</span>}
      </div>
      <div className="mt-2 font-mono text-xs tracking-widest text-subtext uppercase">
        {label}
      </div>
    </motion.div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-lg text-text">{value}</div>
      <div className="mt-0.5 font-mono text-[11px] tracking-wide text-subtext">
        {label}
      </div>
    </div>
  );
}

function CharChip({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn("font-typing text-base font-bold", className)}>
        {value}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function ResultsPanel({
  results,
  config,
  newPB,
  xpEarned,
  isGuest,
  syncStatus,
  onNextTest,
  onRestart,
  onRepeatSame,
}: {
  results: TypingResults;
  config: TypingConfig;
  newPB: boolean;
  xpEarned?: number | null;
  isGuest?: boolean;
  syncStatus?: "saving" | "saved" | "error" | null;
  onNextTest: () => void;
  onRestart: () => void;
  onRepeatSame: () => void;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative rounded-xl border border-border bg-surface p-6 sm:p-8"
    >
      {/* Badges: New personal best & XP Earned */}
      <div className="pointer-events-none absolute -top-4 right-4 z-10 flex items-center gap-2">
        <AnimatePresence>
          {newPB && (
            <motion.div
              key="badge-pb"
              initial={{ scale: 0, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
            >
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="flex items-center gap-1.5 rounded-full border border-main/50 bg-main/20 px-3.5 py-1.5 font-mono text-xs font-bold tracking-wider text-main uppercase shadow-lg shadow-main/20"
              >
                <Trophy className="h-3.5 w-3.5" />
                New Personal Best!
              </motion.div>
            </motion.div>
          )}

          {xpEarned !== undefined && xpEarned !== null && xpEarned > 0 && (
            <motion.div
              key="badge-xp"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
            >
              <div className="flex items-center gap-1.5 rounded-full border border-correct/40 bg-correct/15 px-3 py-1.5 font-mono text-xs font-bold text-correct shadow-md shadow-correct/10">
                <Sparkles className="h-3.5 w-3.5" />
                +{xpEarned} XP
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guest save banner */}
      {isGuest && (
        <motion.div
          variants={item}
          className="mb-6 flex flex-col items-center justify-between gap-3 rounded-lg border border-main/30 bg-main/10 px-4 py-3 text-center sm:flex-row sm:text-left"
        >
          <div className="text-xs text-text">
            <span className="font-semibold text-main">Guest test recorded:</span> Result saved locally in this browser.
            Log in to save your history to the cloud and level up.
          </div>
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-main px-3 py-1.5 font-mono text-xs font-semibold text-bg transition-opacity hover:opacity-90"
          >
            <LogIn className="h-3.5 w-3.5" />
            Login to save
          </Link>
        </motion.div>
      )}

      {/* Saving status for logged-in user */}
      {syncStatus === "saving" && (
        <div className="mb-4 text-right font-mono text-[11px] text-subtext">
          Saving result to cloud...
        </div>
      )}

      {/* Big WPM + accuracy */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-12">
        <BigStat label="words per minute" value={results.wpm} />
        <BigStat label="accuracy" value={results.accuracy} suffix="%" />
      </div>

      {/* Secondary stats */}
      <motion.div
        variants={item}
        className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-6 sm:grid-cols-4"
      >
        <SmallStat label="raw wpm" value={String(Math.round(results.rawWpm))} />
        <SmallStat
          label="consistency"
          value={`${Math.round(results.consistency)}%`}
        />
        <SmallStat label="test type" value={testTypeLabel(config)} />
        <SmallStat
          label="time"
          value={`${(results.timeMs / 1000).toFixed(1)}s`}
        />
      </motion.div>

      {/* Per-second graph */}
      <motion.div variants={item} className="mt-8 border-t border-border pt-6">
        <div className="mb-2 font-mono text-[11px] tracking-widest text-subtext uppercase">
          wpm per second
        </div>
        <WpmChart history={results.history} />
      </motion.div>

      {/* Character breakdown */}
      <motion.div
        variants={item}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-xs text-subtext"
      >
        <CharChip value={results.chars.correct} label="correct" className="text-correct" />
        <CharChip value={results.chars.incorrect} label="incorrect" className="text-error" />
        <CharChip value={results.chars.extra} label="extra" className="text-error/60" />
        <CharChip value={results.chars.missed} label="missed" className="text-text" />
      </motion.div>

      {/* Actions */}
      <motion.div
        variants={item}
        className="mt-7 flex flex-wrap items-center justify-center gap-3"
      >
        <Button onClick={onNextTest}>
          Next Test
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" onClick={onRepeatSame}>
          <Repeat className="h-4 w-4" />
          Repeat Same Test
        </Button>
        <Button variant="ghost" onClick={onRestart} aria-label="Restart same test">
          <RotateCcw className="h-4 w-4" />
          Restart
        </Button>
      </motion.div>
    </motion.div>
  );
}
