"use client";

import Link from "next/link";
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { ActivityHeatmap } from "./activity-heatmap";
import { Button } from "@/components/ui/button";

export interface SummaryStats {
  totalTests: number;
  avgWpm: number;
  highestWpm: number;
  avgAccuracy: number;
  totalTimeSeconds: number;
  streak: { current: number; best: number };
  xp: number;
  level: number;
  recentTests: Array<{
    _id: string;
    mode: string;
    language: string;
    duration?: number;
    wordCount?: number;
    wpm: number;
    accuracy: number;
    createdAt: string;
  }>;
}

interface OverviewTabProps {
  stats: SummaryStats | null;
  heatmapData: Array<{ date: string; count: number; avgWpm: number; avgAccuracy: number }>;
  loading: boolean;
}

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatDateAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OverviewTab({ stats, heatmapData, loading }: OverviewTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-surface-2/40 p-5"
            />
          ))}
        </div>
        <div className="h-44 animate-pulse rounded-2xl border border-border bg-surface-2/40" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-2/40" />
      </div>
    );
  }

  const hasTests = (stats?.totalTests || 0) > 0;

  return (
    <div className="space-y-6">
      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Average WPM */}
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-main/40">
          <div className="flex items-center justify-between text-subtext">
            <span className="font-mono text-xs uppercase tracking-wider">Average Speed</span>
            <Activity className="h-4 w-4 text-main" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-typing text-3xl font-bold text-text sm:text-4xl">
              {stats?.avgWpm || 0}
            </span>
            <span className="font-mono text-xs text-subtext">WPM</span>
          </div>
          <p className="mt-1 text-[11px] text-subtext">Overall typing pace across all tests</p>
        </div>

        {/* 2. Highest WPM */}
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-main/40">
          <div className="flex items-center justify-between text-subtext">
            <span className="font-mono text-xs uppercase tracking-wider">Highest Speed</span>
            <Zap className="h-4 w-4 text-main" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-typing text-3xl font-bold text-main sm:text-4xl">
              {stats?.highestWpm || 0}
            </span>
            <span className="font-mono text-xs text-subtext">WPM record</span>
          </div>
          <p className="mt-1 text-[11px] text-subtext">Your all-time personal speed record</p>
        </div>

        {/* 3. Average Accuracy */}
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-main/40">
          <div className="flex items-center justify-between text-subtext">
            <span className="font-mono text-xs uppercase tracking-wider">Average Accuracy</span>
            <CheckCircle2 className="h-4 w-4 text-correct" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-typing text-3xl font-bold text-correct sm:text-4xl">
              {stats?.avgAccuracy || 0}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-subtext">Typing precision & error avoidance</p>
        </div>

        {/* 4. Total Tests */}
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-main/40">
          <div className="flex items-center justify-between text-subtext">
            <span className="font-mono text-xs uppercase tracking-wider">Total Tests</span>
            <TrendingUp className="h-4 w-4 text-subtext" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-typing text-3xl font-bold text-text sm:text-4xl">
              {stats?.totalTests || 0}
            </span>
            <span className="font-mono text-xs text-subtext">completed</span>
          </div>
          <p className="mt-1 text-[11px] text-subtext">Total tests submitted to date</p>
        </div>

        {/* 5. Total Time Typed */}
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-main/40">
          <div className="flex items-center justify-between text-subtext">
            <span className="font-mono text-xs uppercase tracking-wider">Time Typed</span>
            <Clock className="h-4 w-4 text-subtext" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-typing text-3xl font-bold text-text sm:text-4xl">
              {formatDuration(stats?.totalTimeSeconds || 0)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-subtext">Time spent actively typing in tests</p>
        </div>

        {/* 6. Current Streak */}
        <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-main/40">
          <div className="flex items-center justify-between text-subtext">
            <span className="font-mono text-xs uppercase tracking-wider">Current Streak</span>
            <Flame className="h-4 w-4 text-main" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-typing text-3xl font-bold text-main sm:text-4xl">
              {stats?.streak?.current || 0}
            </span>
            <span className="font-mono text-xs text-subtext">
              days (best: {stats?.streak?.best || 0}d)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-subtext">Consecutive daily practice activity</p>
        </div>
      </div>

      {/* GitHub-style Heatmap */}
      <ActivityHeatmap data={heatmapData} />

      {/* Recent 5 Tests */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
              Recent Tests
            </h3>
            <p className="mt-0.5 text-xs text-subtext">Your 5 latest typing test results</p>
          </div>
          {hasTests && (
            <Link
              href="#history"
              className="font-mono text-xs text-main hover:underline"
            >
              View all history →
            </Link>
          )}
        </div>

        {!hasTests ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-surface-2/20 py-10 text-center">
            <Sparkles className="h-8 w-8 text-main/80" />
            <h4 className="mt-3 font-semibold text-text">No Tests Completed Yet</h4>
            <p className="mt-1 max-w-sm text-xs text-subtext">
              Take your first typing test to start tracking your speed curve, streaks, and personal bests.
            </p>
            <Link href="/" className="mt-4">
              <Button size="sm" className="gap-1.5 cursor-pointer">
                <Play className="h-3.5 w-3.5" />
                Start Typing Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-subtext uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-text">
                {stats?.recentTests.map((t) => (
                  <tr key={t._id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="py-3 px-3 capitalize font-medium">
                      {t.mode} {t.duration ? `(${t.duration}s)` : t.wordCount ? `(${t.wordCount}w)` : ""}
                    </td>
                    <td className="py-3 px-3 capitalize text-subtext">{t.language}</td>
                    <td className="py-3 px-3 font-bold text-main">{t.wpm} WPM</td>
                    <td className="py-3 px-3 font-medium text-correct">{t.accuracy}%</td>
                    <td className="py-3 px-3 text-right text-subtext">
                      {formatDateAgo(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
