"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crown,
  Flame,
  Globe,
  Loader2,
  MapPin,
  Medal,
  Search,
  Sparkles,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AmbientBackground } from "@/components/ambient-background";
import {
  COUNTRY_NAMES,
  getCountryFlag,
  type LeaderboardEntry,
  type LeaderboardResponse,
} from "@/lib/typing/leaderboard";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Timeframe = "global" | "daily" | "weekly" | "monthly" | "country";

export default function LeaderboardPage() {
  const { user, mongoUser } = useAuth();

  // Filters state
  const [timeframe, setTimeframe] = useState<Timeframe>("global");
  const [mode, setMode] = useState<"time" | "words">("time");
  const [modeConfig, setModeConfig] = useState<string>("60");
  const [language, setLanguage] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [page, setPage] = useState<number>(1);

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load available countries once
  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard/countries`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.countries)) {
          setAvailableCountries(d.countries);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const actualTimeframe = timeframe === "country" ? "global" : timeframe;
      const actualCountry = timeframe === "country" ? (selectedCountry === "all" ? "" : selectedCountry) : "";

      const params = new URLSearchParams({
        timeframe: actualTimeframe,
        mode,
        modeConfig,
        language,
        page: String(page),
        limit: "50",
      });

      if (actualCountry) {
        params.append("country", actualCountry);
      }

      const headers: Record<string, string> = {};
      if (user) {
        const token = await user.getIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/leaderboard?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load leaderboard (${res.status})`);
      }
      const json: LeaderboardResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [timeframe, mode, modeConfig, language, selectedCountry, page, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const entries = data?.entries || [];
  const topThree = page === 1 && entries.length >= 3 ? entries.slice(0, 3) : [];
  const userRankInfo = data?.currentUserRank;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-8 sm:px-6 lg:px-8">
      <AmbientBackground />

      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-main/30 bg-main/10 shadow-lg shadow-main/5">
              <Trophy className="h-6 w-6 text-main" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Leaderboard
              </h1>
              <p className="text-sm text-subtext">
                The fastest typists across the globe. Where do your fingers stand?
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
              <Crown className="h-4 w-4 text-main" />
              <span className="font-mono text-xs text-subtext">Top Speed:</span>
              <span className="font-mono text-xs font-bold text-main">
                {entries[0] ? `${entries[0].wpm} WPM` : "--"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
              <Globe className="h-4 w-4 text-subtext" />
              <span className="font-mono text-xs text-subtext">Ranked:</span>
              <span className="font-mono text-xs font-bold text-text">
                {data?.pagination.total || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Current User Rank Strip (if authenticated) */}
        {user && userRankInfo && (
          <div className="relative overflow-hidden rounded-2xl border border-main/30 bg-gradient-to-r from-main/15 via-surface to-surface p-4 shadow-xl shadow-main/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-main font-mono text-base font-black text-bg shadow">
                  #{userRankInfo.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">
                      {mongoUser?.name || user.displayName || "You"}
                    </span>
                    <span className="rounded bg-main/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-main">
                      YOUR STANDING
                    </span>
                  </div>
                  <p className="text-xs text-subtext">
                    {userRankInfo.isInTopList
                      ? "You are currently ranked in the visible table!"
                      : `Overall rank #${userRankInfo.rank} in this category`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-mono text-xl font-bold text-main">
                    {userRankInfo.wpm} <span className="text-xs text-subtext">WPM</span>
                  </div>
                  <div className="text-[11px] text-subtext">
                    {userRankInfo.accuracy}% accuracy
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeframe Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface p-1">
            {(
              [
                { id: "global", label: "Global (All-Time)", icon: Globe },
                { id: "daily", label: "Daily Sprint", icon: Clock },
                { id: "weekly", label: "This Week", icon: Flame },
                { id: "monthly", label: "Monthly Season", icon: Award },
                { id: "country", label: "By Country", icon: MapPin },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              const isActive = timeframe === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTimeframe(t.id);
                    setPage(1);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                    isActive
                      ? "bg-main text-bg shadow-sm font-semibold"
                      : "text-subtext hover:bg-surface-2 hover:text-text",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Country Selector (When Country tab is active) */}
          {timeframe === "country" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtext">Filter Country:</span>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text focus:border-main focus:outline-none"
              >
                <option value="all">All Countries</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {getCountryFlag(c)} {COUNTRY_NAMES[c] || c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface/50 p-3">
          {/* Mode switch */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => {
                  setMode("time");
                  setModeConfig("60");
                  setPage(1);
                }}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  mode === "time" ? "bg-main text-bg font-bold" : "text-subtext hover:text-text",
                )}
              >
                Time
              </button>
              <button
                onClick={() => {
                  setMode("words");
                  setModeConfig("50");
                  setPage(1);
                }}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  mode === "words" ? "bg-main text-bg font-bold" : "text-subtext hover:text-text",
                )}
              >
                Words
              </button>
            </div>

            {/* Mode Config Sub-Pills */}
            <div className="flex items-center gap-1">
              {(mode === "time" ? ["15", "30", "60", "120"] : ["10", "25", "50", "100"]).map(
                (cfg) => (
                  <button
                    key={cfg}
                    onClick={() => {
                      setModeConfig(cfg);
                      setPage(1);
                    }}
                    className={cn(
                      "cursor-pointer rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
                      modeConfig === cfg
                        ? "bg-surface-2 text-main font-bold border border-main/40"
                        : "text-subtext hover:text-text",
                    )}
                  >
                    {cfg}
                    {mode === "time" ? "s" : "w"}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-subtext">Language:</span>
            <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
              {[
                { id: "all", label: "All" },
                { id: "english", label: "English" },
                { id: "bangla", label: "বাংলা" },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setLanguage(l.id);
                    setPage(1);
                  }}
                  className={cn(
                    "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    language === l.id ? "bg-main text-bg font-bold" : "text-subtext hover:text-text",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Podium for Top 3 (on page 1) */}
        {!loading && topThree.length === 3 && (
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3 sm:items-end">
            {/* 2nd Place */}
            <div className="order-2 sm:order-1 flex flex-col items-center rounded-2xl border border-zinc-400/30 bg-gradient-to-b from-zinc-400/10 to-surface p-5 text-center shadow-lg">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-400 bg-surface-2 shadow-md">
                  {topThree[1].user.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topThree[1].user.photo}
                      alt={topThree[1].user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-zinc-400" />
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-zinc-400 px-2 py-0.5 text-[10px] font-black text-black shadow">
                  #2
                </div>
              </div>
              <h3 className="flex items-center gap-1.5 font-bold text-text truncate max-w-full">
                <span>{getCountryFlag(topThree[1].user.country)}</span>
                <span className="truncate">{topThree[1].user.name}</span>
              </h3>
              <div className="mt-2 font-mono text-2xl font-black text-zinc-300">
                {topThree[1].wpm} <span className="text-xs font-normal text-subtext">WPM</span>
              </div>
              <p className="mt-1 font-mono text-xs text-subtext">
                {topThree[1].accuracy}% acc • {topThree[1].consistency || 80}% cons
              </p>
            </div>

            {/* 1st Place (Champion) */}
            <div className="order-1 sm:order-2 flex flex-col items-center rounded-2xl border-2 border-main/60 bg-gradient-to-b from-main/20 via-surface to-surface p-6 text-center shadow-2xl shadow-main/10 sm:-translate-y-2">
              <div className="relative mb-3">
                <Crown className="absolute -top-6 left-1/2 h-7 w-7 -translate-x-1/2 text-main animate-bounce" />
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-3 border-main bg-surface-2 shadow-xl ring-4 ring-main/20">
                  {topThree[0].user.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topThree[0].user.photo}
                      alt={topThree[0].user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-10 w-10 text-main" />
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-main px-2.5 py-0.5 text-xs font-black text-bg shadow-md">
                  #1
                </div>
              </div>
              <h3 className="flex items-center gap-1.5 text-lg font-black text-text truncate max-w-full">
                <span>{getCountryFlag(topThree[0].user.country)}</span>
                <span className="truncate">{topThree[0].user.name}</span>
              </h3>
              <div className="mt-2 font-mono text-3xl font-black text-main">
                {topThree[0].wpm} <span className="text-xs font-normal text-subtext">WPM</span>
              </div>
              <p className="mt-1 font-mono text-xs text-subtext">
                {topThree[0].accuracy}% acc • {topThree[0].consistency || 85}% cons
              </p>
            </div>

            {/* 3rd Place */}
            <div className="order-3 flex flex-col items-center rounded-2xl border border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-surface p-5 text-center shadow-lg">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-amber-600 bg-surface-2 shadow-md">
                  {topThree[2].user.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={topThree[2].user.photo}
                      alt={topThree[2].user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-amber-600" />
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-700 px-2 py-0.5 text-[10px] font-black text-white shadow">
                  #3
                </div>
              </div>
              <h3 className="flex items-center gap-1.5 font-bold text-text truncate max-w-full">
                <span>{getCountryFlag(topThree[2].user.country)}</span>
                <span className="truncate">{topThree[2].user.name}</span>
              </h3>
              <div className="mt-2 font-mono text-2xl font-black text-amber-500">
                {topThree[2].wpm} <span className="text-xs font-normal text-subtext">WPM</span>
              </div>
              <p className="mt-1 font-mono text-xs text-subtext">
                {topThree[2].accuracy}% acc • {topThree[2].consistency || 78}% cons
              </p>
            </div>
          </div>
        )}

        {/* Main Leaderboard Table */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-main" />
              <p className="font-mono text-xs text-subtext">Loading leaderboard rankings...</p>
            </div>
          ) : error ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-error">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="rounded-lg bg-surface-2 px-4 py-2 text-xs font-semibold text-text hover:bg-main hover:text-bg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 p-6 text-center">
              <Trophy className="h-10 w-10 text-subtext/40" />
              <p className="text-base font-semibold text-text">No rankings found for this filter</p>
              <p className="max-w-sm text-xs text-subtext">
                Be the first to complete a test in this category and claim the #1 spot on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-2/50 text-[11px] font-semibold uppercase tracking-wider text-subtext">
                    <th className="py-3.5 pl-6 pr-3">Rank</th>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Country</th>
                    <th className="px-4 py-3.5 text-right">WPM</th>
                    <th className="px-4 py-3.5 text-right hidden sm:table-cell">Raw</th>
                    <th className="px-4 py-3.5 text-right">Accuracy</th>
                    <th className="px-4 py-3.5 text-right hidden md:table-cell">Consistency</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-sm">
                  {entries.map((entry) => {
                    const isCurrentUser =
                      (mongoUser && entry.user._id === mongoUser._id) ||
                      (user && entry.user.firebaseUid === user.uid);

                    return (
                      <tr
                        key={entry._id}
                        className={cn(
                          "transition-colors hover:bg-surface-2/40",
                          isCurrentUser &&
                            "bg-main/10 hover:bg-main/15 border-l-4 border-l-main",
                        )}
                      >
                        {/* Rank */}
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-main font-bold text-xs text-bg shadow">
                                🥇
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-300 font-bold text-xs text-zinc-900 shadow">
                                🥈
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 font-bold text-xs text-white shadow">
                                🥉
                              </span>
                            ) : (
                              <span className="font-bold text-subtext">
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* User Avatar + Name */}
                        <td className="px-4 py-4 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2">
                              {entry.user.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={entry.user.photo}
                                  alt={entry.user.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="font-mono text-xs font-bold text-subtext">
                                  {entry.user.name ? entry.user.name[0].toUpperCase() : "U"}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "truncate font-semibold text-text",
                                    isCurrentUser && "text-main font-bold",
                                  )}
                                >
                                  {entry.user.name || "Anonymous Typist"}
                                </span>
                                {isCurrentUser && (
                                  <span className="rounded bg-main px-1.5 py-0.2 text-[9px] font-black uppercase text-bg">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] text-subtext">
                                Lv. {entry.user.level || 1}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Country */}
                        <td className="px-4 py-4 font-sans text-xs">
                          <div className="flex items-center gap-1.5" title={COUNTRY_NAMES[entry.user.country || ""] || entry.user.country}>
                            <span className="text-base">{getCountryFlag(entry.user.country)}</span>
                            <span className="text-subtext font-mono font-medium">
                              {entry.user.country || "--"}
                            </span>
                          </div>
                        </td>

                        {/* WPM */}
                        <td className="px-4 py-4 text-right">
                          <span className="font-mono text-base font-bold text-main">
                            {entry.wpm}
                          </span>
                        </td>

                        {/* Raw WPM */}
                        <td className="px-4 py-4 text-right text-subtext hidden sm:table-cell">
                          {entry.rawWpm || entry.wpm}
                        </td>

                        {/* Accuracy */}
                        <td className="px-4 py-4 text-right">
                          <span
                            className={cn(
                              "inline-block rounded px-2 py-0.5 text-xs font-semibold",
                              entry.accuracy >= 98
                                ? "bg-success/15 text-success"
                                : entry.accuracy >= 94
                                  ? "bg-main/15 text-main"
                                  : "bg-surface-2 text-subtext",
                            )}
                          >
                            {entry.accuracy}%
                          </span>
                        </td>

                        {/* Consistency */}
                        <td className="px-4 py-4 text-right text-subtext hidden md:table-cell">
                          {entry.consistency ? `${entry.consistency}%` : "--"}
                        </td>

                        {/* Date */}
                        <td className="py-4 pl-4 pr-6 text-right font-sans text-xs text-subtext whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4 text-xs">
              <span className="text-subtext">
                Showing page <span className="font-bold text-text">{data.pagination.page}</span> of{" "}
                <span className="font-bold text-text">{data.pagination.totalPages}</span> (
                {data.pagination.total} typists)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={data.pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-medium text-text transition-colors hover:bg-main hover:text-bg disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-medium text-text transition-colors hover:bg-main hover:text-bg disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
