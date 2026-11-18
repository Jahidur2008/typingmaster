"use client";

import { useMemo, useState } from "react";
import { AlertCircle, BarChart2, Keyboard as KeyboardIcon } from "lucide-react";

export interface WeakKeyItem {
  key: string;
  count: number;
  errorRate: number;
}

interface WeakKeysChartProps {
  weakKeys: WeakKeyItem[];
  totalErrors: number;
}

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export function WeakKeysChart({ weakKeys, totalErrors }: WeakKeysChartProps) {
  const [viewMode, setViewMode] = useState<"bars" | "keyboard">("bars");

  const keyMap = useMemo(() => {
    const map = new Map<string, WeakKeyItem>();
    weakKeys.forEach((k) => map.set(k.key.toLowerCase(), k));
    return map;
  }, [weakKeys]);

  const maxErrorCount = useMemo(() => {
    if (weakKeys.length === 0) return 1;
    return Math.max(...weakKeys.map((k) => k.count), 1);
  }, [weakKeys]);

  if (!weakKeys || weakKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-correct/10 text-correct">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h4 className="mt-3 font-semibold text-text">No Weak Keys Detected</h4>
        <p className="mt-1 text-xs text-subtext">
          Awesome precision! You haven't made significant repeated keystroke errors.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
            Weak Keys Analysis
          </h3>
          <p className="mt-0.5 text-xs text-subtext">
            Keys that cause the most typos ({totalErrors} total logged errors)
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-2/60 p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => setViewMode("bars")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 transition-colors ${
              viewMode === "bars"
                ? "bg-main text-bg font-semibold shadow-xs"
                : "text-subtext hover:text-text"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Top Errors
          </button>
          <button
            type="button"
            onClick={() => setViewMode("keyboard")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 transition-colors ${
              viewMode === "keyboard"
                ? "bg-main text-bg font-semibold shadow-xs"
                : "text-subtext hover:text-text"
            }`}
          >
            <KeyboardIcon className="h-3.5 w-3.5" />
            Keyboard Map
          </button>
        </div>
      </div>

      {viewMode === "bars" ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {weakKeys.slice(0, 8).map((item, idx) => {
            const barWidth = Math.max(8, Math.round((item.count / maxErrorCount) * 100));
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/40 p-3 transition-colors hover:border-border"
              >
                {/* Key block */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-error/40 bg-error/15 font-mono text-lg font-bold text-error shadow-xs">
                  {item.key.toUpperCase()}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-medium text-text">
                      #{idx + 1} Most Frequent Typo
                    </span>
                    <span className="text-subtext">
                      <strong className="text-error font-semibold">{item.count}</strong> errors ({item.errorRate}%)
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-error/80 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Keyboard Heatmap View */
        <div className="mt-6 flex flex-col items-center overflow-x-auto pb-2">
          <div className="min-w-[480px] space-y-1.5 rounded-xl border border-border bg-surface-2/40 p-4">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div
                key={rIdx}
                className={`flex justify-center gap-1.5 ${
                  rIdx === 1 ? "pl-3" : rIdx === 2 ? "pl-7" : ""
                }`}
              >
                {row.map((k) => {
                  const info = keyMap.get(k);
                  const count = info?.count || 0;
                  const intensity = count > 0 ? Math.min(1, count / maxErrorCount) : 0;

                  let heatStyle = "bg-surface text-subtext border-border";
                  if (intensity > 0.6) {
                    heatStyle = "bg-error text-white font-bold border-error shadow-[0_0_8px_rgba(202,71,84,0.6)]";
                  } else if (intensity > 0.3) {
                    heatStyle = "bg-error/60 text-text font-semibold border-error/70";
                  } else if (intensity > 0) {
                    heatStyle = "bg-error/25 text-error font-medium border-error/40";
                  }

                  return (
                    <div
                      key={k}
                      title={count > 0 ? `${k.toUpperCase()}: ${count} errors` : `${k.toUpperCase()}: 0 errors`}
                      className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg border text-sm font-mono transition-all cursor-default ${heatStyle}`}
                    >
                      <span>{k.toUpperCase()}</span>
                      {count > 0 && (
                        <span className="text-[9px] leading-none opacity-85">{count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-subtext">
            Keys with reddish highlight indicate higher frequency of mistypes during tests.
          </p>
        </div>
      )}
    </div>
  );
}
