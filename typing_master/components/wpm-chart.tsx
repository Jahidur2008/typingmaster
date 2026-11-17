"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { WpmSample } from "@/lib/typing/engine";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Filler,
);

/** WPM + raw WPM per second, with red markers where errors happened. */
export function WpmChart({ history }: { history: WpmSample[] }) {
  const { data, options, hasErrors } = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        data: { datasets: [] },
        options: {} as ChartOptions<"line">,
        hasErrors: false,
      };
    }
    const css = getComputedStyle(document.documentElement);
    const main = css.getPropertyValue("--main").trim() || "#e2b714";
    const subtext = css.getPropertyValue("--subtext").trim() || "#646669";
    const error = css.getPropertyValue("--error").trim() || "#ca4754";
    const border = css.getPropertyValue("--border").trim() || "#3a3c40";
    const grid = css.getPropertyValue("--grid-line").trim() || "rgba(0,0,0,0.05)";
    const mono = css.getPropertyValue("--font-jetbrains-mono");

    const errorPoints = history
      .filter((h) => h.errors > 0)
      .map((h) => ({ x: h.second, y: h.rawWpm }));

    const data = {
      datasets: [
        {
          type: "line" as const,
          label: "wpm",
          data: history.map((h) => ({ x: h.second, y: h.wpm })),
          borderColor: main,
          backgroundColor: `${main}1a`,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          fill: true,
        },
        {
          type: "line" as const,
          label: "raw",
          data: history.map((h) => ({ x: h.second, y: h.rawWpm })),
          borderColor: subtext,
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.35,
          fill: false,
        },
        ...(errorPoints.length > 0
          ? [
              {
                type: "line" as const,
                label: "errors",
                data: errorPoints,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: error,
                pointBorderColor: error,
                showLine: false,
              },
            ]
          : []),
      ],
    };

    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.75)",
          titleFont: { family: mono },
          bodyFont: { family: mono },
          callbacks: {
            label: (ctx) =>
              ctx.dataset.label === "errors"
                ? "errors"
                : `${ctx.dataset.label}: ${Math.round(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 1,
          max: Math.max(history.length, 2),
          ticks: {
            stepSize: Math.max(1, Math.ceil(history.length / 12)),
            color: subtext,
            font: { family: mono, size: 10 },
            precision: 0,
          },
          grid: { color: grid },
          border: { color: border },
        },
        y: {
          beginAtZero: true,
          ticks: { color: subtext, font: { family: mono, size: 10 } },
          grid: { color: grid },
          border: { color: border },
        },
      },
    };

    return { data, options, hasErrors: errorPoints.length > 0 };
  }, [history]);

  return (
    <div>
      <div className="h-48 w-full sm:h-60">
        {history.length > 0 && <Line data={data} options={options} />}
      </div>
      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[11px] text-subtext">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded-full bg-main" /> wpm
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-0 w-4 border-t border-dashed"
            style={{ borderColor: "var(--subtext)" }}
          />{" "}
          raw
        </span>
        {hasErrors && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-error" /> errors
          </span>
        )}
      </div>
    </div>
  );
}
