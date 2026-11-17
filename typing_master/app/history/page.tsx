"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  History as HistoryIcon,
  LogIn,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getGuestResults, type SavedResult } from "@/lib/typing/history";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { AmbientBackground } from "@/components/ambient-background";
import { cn } from "@/lib/utils";

const WpmChart = dynamic(
  () => import("@/components/wpm-chart").then((m) => m.WpmChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 w-full rounded-xl bg-surface-2/40 animate-pulse flex items-center justify-center font-mono text-xs text-subtext">
        Loading performance graph...
      </div>
    ),
  },
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

export default function HistoryPage() {
  const { user, token, loading: authLoading } = useAuth();

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

  // Selected result for detail modal
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null);

  // Close modal on escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedResult(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch results (from backend if logged in, from localStorage if guest)
  useEffect(() => {
    if (authLoading) return;

    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    if (user && token) {
      // Authenticated user — fetch from server API
      const [sortBy, order] = sortOption.split("-");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        order,
      });

      if (modeFilter !== "all") params.set("mode", modeFilter);
      if (langFilter !== "all") params.set("language", langFilter);

      if (dateFilter !== "all") {
        const now = new Date();
        if (dateFilter === "today") {
          const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          params.set("startDate", past.toISOString());
        } else if (dateFilter === "week") {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          params.set("startDate", past.toISOString());
        } else if (dateFilter === "month") {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          params.set("startDate", past.toISOString());
        }
      }

      fetch(`${API_URL}/api/results?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => {
          if (isMounted) {
            setResults(data.results || []);
            setTotal(data.pagination?.total || 0);
            setTotalPages(data.pagination?.totalPages || 1);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("[history] Failed to fetch server results, using local storage:", err);
          if (isMounted) {
            loadLocalResults();
          }
        });
    } else {
      // Guest user — load from localStorage
      loadLocalResults();
    }

    function loadLocalResults() {
      const local = getGuestResults();
      let filtered = [...local];

      if (modeFilter !== "all") {
        filtered = filtered.filter((r) => r.mode === modeFilter);
      }
      if (langFilter !== "all") {
        filtered = filtered.filter((r) => r.language === langFilter);
      }
      if (dateFilter !== "all") {
        const now = Date.now();
        const cutoff =
          dateFilter === "today"
            ? now - 24 * 3600 * 1000
            : dateFilter === "week"
              ? now - 7 * 24 * 3600 * 1000
              : now - 30 * 24 * 3600 * 1000;
        filtered = filtered.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
      }

      // Sort
      const [sortBy, order] = sortOption.split("-");
      filtered.sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === "createdAt") {
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
        } else if (sortBy === "wpm") {
          valA = a.wpm;
          valB = b.wpm;
        } else if (sortBy === "accuracy") {
          valA = a.accuracy;
          valB = b.accuracy;
        }
        return order === "asc" ? valA - valB : valB - valA;
      });

      const totalItems = filtered.length;
      const pages = Math.max(1, Math.ceil(totalItems / limit));
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      if (isMounted) {
        setResults(paged);
        setTotal(totalItems);
        setTotalPages(pages);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, token, authLoading, modeFilter, langFilter, dateFilter, sortOption, page, limit]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const formatConfig = (result: SavedResult) => {
    if (result.mode === "time") return `${result.duration || 30}s`;
    if (result.mode === "words") return `${result.wordCount || 25}w`;
    if (result.mode === "quote") return result.quoteLength || "quote";
    return result.mode;
  };

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <AmbientBackground />

      <div className="relative w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-3 py-1 font-mono text-xs font-semibold text-main uppercase">
              <HistoryIcon className="h-3.5 w-3.5" />
              Typing History
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Test Log & Performance
            </h1>
            <p className="mt-1 text-sm text-subtext">
              Review your past tests, spot typing trends, and analyze your keystroke graphs.
            </p>
          </div>

          <Link href="/">
            <Button size="sm">
              <Zap className="h-4 w-4" />
              New Test
            </Button>
          </Link>
        </div>

        {/* Guest Banner */}
        {!user && !authLoading && (
          <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-main/40 bg-main/10 p-4 sm:flex-row sm:p-5">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-text">
                Viewing local guest history
              </p>
              <p className="mt-0.5 text-xs text-subtext">
                Your tests are currently stored only in this browser&apos;s localStorage.
                Sign in to back up your results to MongoDB and track your stats across any device.
              </p>
            </div>
            <Link
              href="/login?redirect=/history"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-main px-4 py-2 font-mono text-xs font-bold text-bg transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login to save progress
            </Link>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode filter */}
            <div className="relative">
              <select
                value={modeFilter}
                onChange={(e) => {
                  setModeFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-border bg-surface-2 px-3 py-1.5 pr-8 font-mono text-xs text-text outline-none transition-colors hover:border-main/50 focus:border-main"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value} className="bg-surface text-text">
                    {m.label}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtext" />
            </div>

            {/* Language filter */}
            <div className="relative">
              <select
                value={langFilter}
                onChange={(e) => {
                  setLangFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-border bg-surface-2 px-3 py-1.5 pr-8 font-mono text-xs text-text outline-none transition-colors hover:border-main/50 focus:border-main"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-surface text-text">
                    {l.label}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtext" />
            </div>

            {/* Date range */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-border bg-surface-2 px-3 py-1.5 pr-8 font-mono text-xs text-text outline-none transition-colors hover:border-main/50 focus:border-main"
              >
                {DATE_RANGES.map((d) => (
                  <option key={d.value} value={d.value} className="bg-surface text-text">
                    {d.label}
                  </option>
                ))}
              </select>
              <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtext" />
            </div>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-subtext">Sort:</span>
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-border bg-surface-2 px-3 py-1.5 pr-8 font-mono text-xs text-text outline-none transition-colors hover:border-main/50 focus:border-main"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-surface text-text">
                    {s.label}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtext" />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-border bg-surface-2/60 text-subtext">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Language</th>
                  <th className="px-4 py-3 font-medium text-right">WPM</th>
                  <th className="px-4 py-3 font-medium text-right">Raw</th>
                  <th className="px-4 py-3 font-medium text-right">Accuracy</th>
                  <th className="px-4 py-3 font-medium text-right">Consistency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-text">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-subtext">
                      Loading typing history...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-subtext">
                      <p className="text-base text-text">No test results found</p>
                      <p className="mt-1 text-xs">
                        Take your first typing test to see your history logged here.
                      </p>
                      <div className="mt-4">
                        <Link href="/">
                          <Button size="sm">Start Typing Now</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.map((r, i) => (
                    <tr
                      key={r._id || r.id || i}
                      onClick={() => setSelectedResult(r)}
                      className="cursor-pointer transition-colors hover:bg-surface-2/70"
                    >
                      <td className="px-4 py-3.5 text-subtext">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize">{r.mode}</span>{" "}
                        <span className="text-subtext">({formatConfig(r)})</span>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-subtext">
                        {r.language}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-main">
                        {Math.round(r.wpm)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-subtext">
                        {Math.round(r.rawWpm)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={cn(
                            r.accuracy >= 98
                              ? "text-correct"
                              : r.accuracy >= 90
                                ? "text-text"
                                : "text-error",
                          )}
                        >
                          {Math.round(r.accuracy)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-subtext">
                        {Math.round(r.consistency)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-surface-2/40 px-4 py-3 font-mono text-xs text-subtext">
              <div>
                Showing {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)} of {total} tests
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border text-text transition-colors hover:border-main/50 hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded border border-border text-text transition-colors hover:border-main/50 hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedResult(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedResult(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-subtext transition-colors hover:bg-surface-2 hover:text-text"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal header */}
            <div className="mb-6 border-b border-border pb-4">
              <div className="font-mono text-xs tracking-wider text-subtext uppercase">
                {formatDate(selectedResult.createdAt)} • {selectedResult.language}
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-text">
                <span className="capitalize">{selectedResult.mode}</span> test{" "}
                <span className="text-sm font-normal text-subtext">
                  ({formatConfig(selectedResult)})
                </span>
              </h2>
            </div>

            {/* Big stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface-2/50 p-4 text-center">
                <div className="font-typing text-4xl font-bold text-main">
                  {Math.round(selectedResult.wpm)}
                </div>
                <div className="mt-1 font-mono text-[11px] tracking-wider text-subtext uppercase">
                  WPM
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/50 p-4 text-center">
                <div className="font-typing text-4xl font-bold text-text">
                  {Math.round(selectedResult.accuracy)}%
                </div>
                <div className="mt-1 font-mono text-[11px] tracking-wider text-subtext uppercase">
                  Accuracy
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/50 p-4 text-center">
                <div className="font-typing text-4xl font-bold text-subtext">
                  {Math.round(selectedResult.rawWpm)}
                </div>
                <div className="mt-1 font-mono text-[11px] tracking-wider text-subtext uppercase">
                  Raw WPM
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/50 p-4 text-center">
                <div className="font-typing text-4xl font-bold text-subtext">
                  {Math.round(selectedResult.consistency)}%
                </div>
                <div className="mt-1 font-mono text-[11px] tracking-wider text-subtext uppercase">
                  Consistency
                </div>
              </div>
            </div>

            {/* Keystroke graph */}
            {selectedResult.wpmPerSecond && selectedResult.wpmPerSecond.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="mb-2 font-mono text-[11px] tracking-wider text-subtext uppercase">
                  WPM per second graph
                </div>
                <WpmChart history={selectedResult.wpmPerSecond} />
              </div>
            )}

            {/* Character statistics */}
            {selectedResult.chars && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-4 font-mono text-xs">
                <span className="text-correct">
                  {selectedResult.chars.correct} correct
                </span>
                <span className="text-error">
                  {selectedResult.chars.incorrect} incorrect
                </span>
                <span className="text-error/60">
                  {selectedResult.chars.extra} extra
                </span>
                <span className="text-subtext">
                  {selectedResult.chars.missed} missed
                </span>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedResult(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
