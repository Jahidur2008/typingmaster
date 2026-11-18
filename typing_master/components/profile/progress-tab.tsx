"use client";

import { useEffect, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Loader2,
  Minus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { API_URL } from "@/lib/api-config";
import type { ProgressItem } from "./progress-chart";
import { WeakKeysChart, type WeakKeyItem } from "./weak-keys-chart";

// Lazy load Chart.js to keep bundle lightweight
const ProgressChart = dynamic(
  () => import("./progress-chart").then((m) => m.ProgressChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full animate-pulse items-center justify-center rounded-xl bg-surface-2/40 font-mono text-xs text-subtext">
        Loading performance chart...
      </div>
    ),
  },
);

interface ProgressTabProps {
  token: string | null;
}

export function ProgressTab({ token }: ProgressTabProps) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [language, setLanguage] = useState<string>("all");
  const [mode, setMode] = useState<string>("all");

  const [progressData, setProgressData] = useState<ProgressItem[]>([]);
  const [comparison, setComparison] = useState<{
    diffWpm: number;
    diffAccuracy: number;
    text: string;
  }>({ diffWpm: 0, diffAccuracy: 0, text: "" });

  const [weakKeys, setWeakKeys] = useState<WeakKeyItem[]>([]);
  const [totalKeyErrors, setTotalKeyErrors] = useState(0);

  const [loading, setLoading] = useState(true);

  // Fetch progress series & weak keys
  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    setLoading(true);

    const query = new URLSearchParams({
      range,
      language: language !== "all" ? language : "",
      mode: mode !== "all" ? mode : "",
    });

    Promise.all([
      fetch(`${API_URL}/api/stats/progress?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/stats/weak-keys`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([progRes, weakRes]) => {
        if (!isCurrent) return;
        if (progRes) {
          setProgressData(progRes.history || []);
          setComparison(progRes.comparison || { diffWpm: 0, diffAccuracy: 0, text: "" });
        }
        if (weakRes) {
          setWeakKeys(weakRes.weakKeys || []);
          setTotalKeyErrors(weakRes.totalErrors || 0);
        }
      })
      .catch((err) => console.warn("[progress-tab] Fetch error:", err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, range, language, mode]);

  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-main" />
              <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
                Performance Curve
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-subtext">
              Track your typing speed (WPM) and accuracy improvement over time
            </p>
          </div>

          {/* Controls: Range, Language, Mode */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Range Pills */}
            <div className="flex rounded-lg border border-border bg-surface-2/60 p-0.5">
              {(["daily", "weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 capitalize transition-colors ${
                    range === r
                      ? "bg-main text-bg font-bold shadow-xs"
                      : "text-subtext hover:text-text"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Language filter */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-xs text-text outline-none hover:border-main/50"
            >
              <option value="all">All Languages</option>
              <option value="english">English</option>
              <option value="bangla">বাংলা (Bangla)</option>
            </select>

            {/* Mode filter */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-2.5 py-1 text-xs text-text outline-none hover:border-main/50"
            >
              <option value="all">All Modes</option>
              <option value="time">Time</option>
              <option value="words">Words</option>
              <option value="quote">Quote</option>
            </select>
          </div>
        </div>

        {/* Period Comparison Alert Pill */}
        {comparison.text && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/80 bg-surface-2/40 px-3.5 py-2 font-mono text-xs">
            {comparison.diffWpm > 0 ? (
              <span className="flex items-center gap-1 font-semibold text-correct">
                <ArrowUpRight className="h-4 w-4" />
                +{comparison.diffWpm} WPM
              </span>
            ) : comparison.diffWpm < 0 ? (
              <span className="flex items-center gap-1 font-semibold text-error">
                <ArrowDownRight className="h-4 w-4" />
                {comparison.diffWpm} WPM
              </span>
            ) : (
              <span className="flex items-center gap-1 text-subtext">
                <Minus className="h-4 w-4" />
                No speed change
              </span>
            )}
            <span className="text-subtext">•</span>
            <span className="text-text">{comparison.text}</span>
          </div>
        )}

        {/* Chart View */}
        <div className="mt-6">
          {loading ? (
            <div className="flex h-72 w-full items-center justify-center rounded-xl bg-surface-2/30 font-mono text-xs text-subtext">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-main" />
              Aggregating stats from MongoDB...
            </div>
          ) : (
            <ProgressChart data={progressData} />
          )}
        </div>
      </div>

      {/* Weak Keys Visualizer */}
      <WeakKeysChart weakKeys={weakKeys} totalErrors={totalKeyErrors} />
    </div>
  );
}
