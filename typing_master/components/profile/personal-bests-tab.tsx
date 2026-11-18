"use client";

import { useEffect, useState } from "react";
import { Award, Crown, Loader2, Sparkles, Trophy } from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface PBRecord {
  duration?: number;
  wordCount?: number;
  quoteLength?: string;
  label: string;
  wpm: number | null;
  accuracy: number | null;
  language: string;
  date: string | null;
}

interface PersonalBestsData {
  time: PBRecord[];
  words: PBRecord[];
  quote: PBRecord[];
}

interface PersonalBestsTabProps {
  token: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PersonalBestsTab({ token }: PersonalBestsTabProps) {
  const [language, setLanguage] = useState("all");
  const [pbs, setPbs] = useState<PersonalBestsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    setLoading(true);

    const query = new URLSearchParams({
      language: language !== "all" ? language : "",
    });

    fetch(`${API_URL}/api/results/personal-bests?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isCurrent) return;
        if (data) setPbs(data);
      })
      .catch((err) => console.warn("[personal-bests] Fetch error:", err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, language]);

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-main" />
            <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
              Personal Bests
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-subtext">
            Your all-time highest speeds categorized by mode and length
          </p>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-subtext">Language:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="cursor-pointer rounded-lg border border-border bg-surface-2/80 px-3 py-1.5 text-xs text-text outline-none hover:border-main/50"
          >
            <option value="all">All Languages</option>
            <option value="english">English</option>
            <option value="bangla">বাংলা (Bangla)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-surface font-mono text-xs text-subtext">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-main" />
          Loading your records...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Time Mode Table */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-main/20 text-main font-mono text-xs font-bold">
                T
              </span>
              <h4 className="font-mono text-sm font-semibold text-text uppercase">
                Time Modes (15s, 30s, 60s, 120s)
              </h4>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-subtext uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Language</th>
                    <th className="py-2.5 px-3">Highest WPM</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3 text-right">Date Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-text">
                  {pbs?.time.map((item) => (
                    <tr key={item.label} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-text flex items-center gap-2">
                        {item.wpm ? <Crown className="h-4 w-4 text-main shrink-0" /> : null}
                        {item.label}
                      </td>
                      <td className="py-3 px-3 capitalize text-subtext">{item.language}</td>
                      <td className="py-3 px-3">
                        {item.wpm ? (
                          <span className="font-bold text-main text-sm">{item.wpm} WPM</span>
                        ) : (
                          <span className="text-subtext/60 font-sans italic">Not tested yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.accuracy ? (
                          <span className="font-semibold text-correct">{item.accuracy}%</span>
                        ) : (
                          <span className="text-subtext/60">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-subtext">
                        {formatDate(item.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Words Mode Table */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-correct/20 text-correct font-mono text-xs font-bold">
                W
              </span>
              <h4 className="font-mono text-sm font-semibold text-text uppercase">
                Word Count Modes (10, 25, 50, 100 Words)
              </h4>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-subtext uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Language</th>
                    <th className="py-2.5 px-3">Highest WPM</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3 text-right">Date Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-text">
                  {pbs?.words.map((item) => (
                    <tr key={item.label} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-text flex items-center gap-2">
                        {item.wpm ? <Crown className="h-4 w-4 text-correct shrink-0" /> : null}
                        {item.label}
                      </td>
                      <td className="py-3 px-3 capitalize text-subtext">{item.language}</td>
                      <td className="py-3 px-3">
                        {item.wpm ? (
                          <span className="font-bold text-correct text-sm">{item.wpm} WPM</span>
                        ) : (
                          <span className="text-subtext/60 font-sans italic">Not tested yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.accuracy ? (
                          <span className="font-semibold text-correct">{item.accuracy}%</span>
                        ) : (
                          <span className="text-subtext/60">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-subtext">
                        {formatDate(item.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Quote Mode Table */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-main/20 text-main font-mono text-xs font-bold">
                Q
              </span>
              <h4 className="font-mono text-sm font-semibold text-text uppercase">
                Quote Modes (Short, Medium, Long)
              </h4>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border/70 text-subtext uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Quote Length</th>
                    <th className="py-2.5 px-3">Language</th>
                    <th className="py-2.5 px-3">Highest WPM</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3 text-right">Date Achieved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-text">
                  {pbs?.quote.map((item) => (
                    <tr key={item.label} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-text flex items-center gap-2">
                        {item.wpm ? <Crown className="h-4 w-4 text-main shrink-0" /> : null}
                        {item.label}
                      </td>
                      <td className="py-3 px-3 capitalize text-subtext">{item.language}</td>
                      <td className="py-3 px-3">
                        {item.wpm ? (
                          <span className="font-bold text-main text-sm">{item.wpm} WPM</span>
                        ) : (
                          <span className="text-subtext/60 font-sans italic">Not tested yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.accuracy ? (
                          <span className="font-semibold text-correct">{item.accuracy}%</span>
                        ) : (
                          <span className="text-subtext/60">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-subtext">
                        {formatDate(item.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
