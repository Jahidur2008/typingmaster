"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  History as HistoryIcon,
  Loader2,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { API_URL } from "@/lib/api-config";
import type { SavedResult } from "@/lib/typing/history";
import { Button } from "@/components/ui/button";

const WpmChart = dynamic(
  () => import("@/components/wpm-chart").then((m) => m.WpmChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-44 w-full animate-pulse items-center justify-center rounded-xl bg-surface-2/40 font-mono text-xs text-subtext">
        Loading test graph...
      </div>
    ),
  },
);

interface HistoryTabProps {
  token: string | null;
}

const MODES = [
  { value: "all", label: "All Modes" },
  { value: "time", label: "Time" },
  { value: "words", label: "Words" },
  { value: "quote", label: "Quote" },
  { value: "custom", label: "Custom" },
  { value: "zen", label: "Zen" },
];

const LANGUAGES = [
  { value: "all", label: "All Languages" },
  { value: "english", label: "English" },
  { value: "bangla", label: "Bangla" },
];

const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Last 24 Hours" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
];

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Date (Newest)" },
  { value: "createdAt-asc", label: "Date (Oldest)" },
  { value: "wpm-desc", label: "WPM (Highest)" },
  { value: "wpm-asc", label: "WPM (Lowest)" },
  { value: "accuracy-desc", label: "Accuracy (Highest)" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryTab({ token }: HistoryTabProps) {
  const [modeFilter, setModeFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOption, setSortOption] = useState("createdAt-desc");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [results, setResults] = useState<SavedResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Selected test for modal graph details
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedResult(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    setLoading(true);

    const [sortBy, order] = sortOption.split("-");
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: sortBy || "createdAt",
      order: order || "desc",
    });

    if (modeFilter !== "all") params.append("mode", modeFilter);
    if (langFilter !== "all") params.append("language", langFilter);

    if (dateFilter !== "all") {
      const now = new Date();
      if (dateFilter === "today") {
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        params.append("startDate", start.toISOString());
      } else if (dateFilter === "week") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.append("startDate", start.toISOString());
      } else if (dateFilter === "month") {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.append("startDate", start.toISOString());
      }
    }

    fetch(`${API_URL}/api/results?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isCurrent) return;
        if (data) {
          setResults(data.results || []);
          setTotal(data.pagination?.total || 0);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      })
      .catch((err) => console.warn("[history-tab] Fetch error:", err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, page, modeFilter, langFilter, dateFilter, sortOption]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-main" />
              <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
                Test History
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-subtext">
              Showing {results.length} of {total} completed tests. Click any row for details.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Mode Filter */}
            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-2.5 py-1.5 text-xs text-text outline-none hover:border-main/50"
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              value={langFilter}
              onChange={(e) => {
                setLangFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-2.5 py-1.5 text-xs text-text outline-none hover:border-main/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-2.5 py-1.5 text-xs text-text outline-none hover:border-main/50"
            >
              {DATE_RANGES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-2.5 py-1.5 text-xs text-text outline-none hover:border-main/50"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex h-64 w-full items-center justify-center rounded-xl bg-surface-2/20 font-mono text-xs text-subtext">
            <Loader2 className="h-5 w-5 animate-spin mr-2 text-main" />
            Loading test history...
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-surface-2/20 py-12 text-center">
            <HistoryIcon className="h-8 w-8 text-subtext/60" />
            <h4 className="mt-3 font-semibold text-text">No Test History Found</h4>
            <p className="mt-1 text-xs text-subtext">
              Try resetting your filters or take a new typing test.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border/80 text-subtext uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">WPM</th>
                  <th className="py-2.5 px-3">Raw</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Consistency</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-text">
                {results.map((r) => (
                  <tr
                    key={r._id || r.id}
                    onClick={() => setSelectedResult(r)}
                    className="hover:bg-surface-2/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-medium capitalize flex items-center gap-2 group-hover:text-main">
                      <span>{r.mode}</span>
                      <span className="text-[10px] text-subtext">
                        {r.duration ? `${r.duration}s` : r.wordCount ? `${r.wordCount}w` : ""}
                      </span>
                    </td>
                    <td className="py-3 px-3 capitalize text-subtext">{r.language}</td>
                    <td className="py-3 px-3 font-bold text-main">{r.wpm}</td>
                    <td className="py-3 px-3 text-subtext">{r.rawWpm || "—"}</td>
                    <td className="py-3 px-3 font-semibold text-correct">{r.accuracy}%</td>
                    <td className="py-3 px-3 text-subtext">{r.consistency ? `${r.consistency}%` : "—"}</td>
                    <td className="py-3 px-3 text-right text-subtext">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-subtext">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="cursor-pointer gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Test Detail Graph Modal */}
      {selectedResult && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedResult(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-subtext uppercase">
                  <span>{selectedResult.mode}</span>
                  <span>•</span>
                  <span>{selectedResult.language}</span>
                  <span>•</span>
                  <span>{formatDate(selectedResult.createdAt)}</span>
                </div>
                <h3 className="text-xl font-bold text-text mt-0.5">
                  Test Performance Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="rounded-lg p-1.5 text-subtext hover:bg-surface-2 hover:text-text cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono">
              <div className="rounded-xl border border-border/80 bg-surface-2/40 p-3 text-center">
                <div className="text-[11px] text-subtext uppercase">WPM</div>
                <div className="text-2xl font-bold text-main">{selectedResult.wpm}</div>
              </div>
              <div className="rounded-xl border border-border/80 bg-surface-2/40 p-3 text-center">
                <div className="text-[11px] text-subtext uppercase">Accuracy</div>
                <div className="text-2xl font-bold text-correct">{selectedResult.accuracy}%</div>
              </div>
              <div className="rounded-xl border border-border/80 bg-surface-2/40 p-3 text-center">
                <div className="text-[11px] text-subtext uppercase">Raw WPM</div>
                <div className="text-2xl font-bold text-text">{selectedResult.rawWpm || "—"}</div>
              </div>
              <div className="rounded-xl border border-border/80 bg-surface-2/40 p-3 text-center">
                <div className="text-[11px] text-subtext uppercase">Consistency</div>
                <div className="text-2xl font-bold text-text">{selectedResult.consistency || 0}%</div>
              </div>
            </div>

            {/* Characters breakdown */}
            {selectedResult.chars && (
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2/20 px-4 py-2.5 font-mono text-xs">
                <span className="text-subtext">Characters:</span>
                <div className="flex items-center gap-4">
                  <span className="text-correct">
                    <strong>{selectedResult.chars.correct || 0}</strong> correct
                  </span>
                  <span className="text-error">
                    <strong>{selectedResult.chars.incorrect || 0}</strong> errors
                  </span>
                  <span className="text-subtext">
                    <strong>{selectedResult.chars.extra || 0}</strong> extra
                  </span>
                  <span className="text-subtext">
                    <strong>{selectedResult.chars.missed || 0}</strong> missed
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Second-by-Second WPM Graph */}
            <div>
              <div className="font-mono text-xs text-subtext mb-2 uppercase">Speed Graph</div>
              <div className="h-44 w-full rounded-xl border border-border/60 bg-surface-2/30 p-2">
                {selectedResult.wpmPerSecond && selectedResult.wpmPerSecond.length > 0 ? (
                  <WpmChart history={selectedResult.wpmPerSecond} />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-subtext">
                    No per-second telemetry recorded for this test.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedResult(null)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
