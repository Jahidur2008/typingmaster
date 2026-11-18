"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
);

export interface ProgressItem {
  period: string;
  date?: string;
  wpm: number;
  highestWpm?: number;
  accuracy: number;
  count: number;
}

interface ProgressChartProps {
  data: ProgressItem[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const css = getComputedStyle(document.documentElement);
    const main = css.getPropertyValue("--main").trim() || "#e2b714";
    const correct = css.getPropertyValue("--correct").trim() || "#57c793";

    const labels = data.map((d) => d.period);

    return {
      labels,
      datasets: [
        {
          label: "Average WPM",
          data: data.map((d) => d.wpm),
          borderColor: main,
          backgroundColor: `${main}1f`,
          borderWidth: 2.5,
          pointRadius: data.length > 30 ? 0 : 3,
          pointHoverRadius: 6,
          pointBackgroundColor: main,
          pointBorderColor: main,
          tension: 0.35,
          fill: true,
          yAxisID: "y",
        },
        {
          label: "Average Accuracy (%)",
          data: data.map((d) => d.accuracy),
          borderColor: correct,
          borderDash: [5, 4],
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: correct,
          pointBorderColor: correct,
          tension: 0.35,
          fill: false,
          yAxisID: "y1",
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<"line"> = useMemo(() => {
    const css = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const subtext = css?.getPropertyValue("--subtext").trim() || "#646669";
    const grid = css?.getPropertyValue("--grid-line").trim() || "rgba(255,255,255,0.06)";
    const mono = css?.getPropertyValue("--font-jetbrains-mono");

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: subtext,
            font: { family: mono, size: 11 },
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          backgroundColor: "rgba(20, 21, 23, 0.95)",
          titleColor: "#e2b714",
          bodyColor: "#d1d0c5",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          padding: 10,
          titleFont: { family: mono, size: 12, weight: "bold" },
          bodyFont: { family: mono, size: 12 },
          displayColors: true,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: subtext,
            font: { family: mono, size: 10 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          type: "linear" as const,
          display: true,
          position: "left" as const,
          title: {
            display: true,
            text: "WPM",
            color: subtext,
            font: { family: mono, size: 10 },
          },
          grid: { color: grid },
          ticks: {
            color: subtext,
            font: { family: mono, size: 10 },
            precision: 0,
          },
        },
        y1: {
          type: "linear" as const,
          display: true,
          position: "right" as const,
          min: 50,
          max: 100,
          grid: { display: false },
          title: {
            display: true,
            text: "Accuracy (%)",
            color: subtext,
            font: { family: mono, size: 10 },
          },
          ticks: {
            color: subtext,
            font: { family: mono, size: 10 },
            callback: (v) => `${v}%`,
          },
        },
      },
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl bg-surface-2/30 p-6 text-center font-mono text-xs text-subtext">
        <p>No progress records found for this period/filter.</p>
        <p className="mt-1 text-[11px] text-subtext/70">Complete tests to visualize your speed curve!</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full sm:h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
