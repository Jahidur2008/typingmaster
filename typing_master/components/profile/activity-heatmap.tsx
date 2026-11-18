"use client";

import { useMemo, useState } from "react";

interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  avgWpm: number;
  avgAccuracy: number;
}

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    avgWpm: number;
    x: number;
    y: number;
  } | null>(null);

  // Map dates to metrics
  const dateMap = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    data.forEach((d) => map.set(d.date, d));
    return map;
  }, [data]);

  // Generate 52 weeks (364 days) ending on the current week
  const { weeks, monthLabels, totalYearTests } = useMemo(() => {
    const today = new Date();
    // Sunday of 52 weeks ago
    const start = new Date(today);
    start.setDate(today.getDate() - (52 * 7) + (6 - today.getDay()));

    const weeksArr: Array<Array<{ dateStr: string; day: HeatmapDay | undefined; dayOfWeek: number }>> = [];
    const months: Array<{ label: string; colIndex: number }> = [];

    let currentWeek: Array<{ dateStr: string; day: HeatmapDay | undefined; dayOfWeek: number }> = [];
    let lastMonth = -1;
    let totalTests = 0;

    const curr = new Date(start);
    for (let i = 0; i < 52 * 7; i++) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, "0");
      const day = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const dayData = dateMap.get(dateStr);

      if (dayData) {
        totalTests += dayData.count;
      }

      currentWeek.push({
        dateStr,
        day: dayData,
        dayOfWeek: curr.getDay(),
      });

      if (curr.getMonth() !== lastMonth && currentWeek.length === 1) {
        const monthShort = curr.toLocaleString("en-US", { month: "short" });
        months.push({ label: monthShort, colIndex: weeksArr.length });
        lastMonth = curr.getMonth();
      }

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek);
    }

    return { weeks: weeksArr, monthLabels: months, totalYearTests: totalTests };
  }, [dateMap]);

  function getColorClass(count: number): string {
    if (count === 0) return "bg-surface-2/70 hover:border-subtext/50";
    if (count <= 2) return "bg-main/30 border-main/40 hover:bg-main/40";
    if (count <= 5) return "bg-main/60 border-main/70 hover:bg-main/70";
    if (count <= 8) return "bg-main/80 border-main/90 hover:bg-main/90";
    return "bg-main border-main shadow-[0_0_8px_rgba(226,183,20,0.5)]";
  }

  return (
    <div className="relative rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
            Activity Heatmap
          </h3>
          <p className="mt-0.5 text-xs text-subtext">
            {totalYearTests} tests completed in the past 12 months
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 font-mono text-xs text-subtext">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-xs bg-surface-2/70 border border-border" />
            <span className="h-3 w-3 rounded-xs bg-main/30" />
            <span className="h-3 w-3 rounded-xs bg-main/60" />
            <span className="h-3 w-3 rounded-xs bg-main/80" />
            <span className="h-3 w-3 rounded-xs bg-main" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="mt-6 overflow-x-auto pb-2 scroll-smooth">
        <div className="inline-block min-w-[700px]">
          {/* Months header */}
          <div className="flex text-[10px] font-mono text-subtext mb-1 pl-6">
            {weeks.map((_, i) => {
              const m = monthLabels.find((ml) => ml.colIndex === i);
              return (
                <div key={i} className="w-[13px] text-center">
                  {m ? m.label : ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1">
            {/* Days labels */}
            <div className="flex flex-col justify-between text-[9px] font-mono text-subtext pr-1 py-0.5 select-none">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1">
                  {week.map((dayItem) => {
                    const count = dayItem.day?.count || 0;
                    const avgWpm = dayItem.day?.avgWpm || 0;
                    return (
                      <div
                        key={dayItem.dateStr}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredDay({
                            date: dayItem.dateStr,
                            count,
                            avgWpm,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`h-[11px] w-[11px] rounded-xs border border-transparent transition-all cursor-pointer ${getColorClass(
                          count,
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-bg/95 px-2.5 py-1.5 shadow-xl backdrop-blur-sm text-xs font-mono"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y - 8,
          }}
        >
          <div className="font-bold text-main">{hoveredDay.date}</div>
          <div className="text-text">
            {hoveredDay.count > 0 ? (
              <>
                <span className="font-semibold text-correct">{hoveredDay.count}</span> tests •{" "}
                <span className="font-semibold text-text">{hoveredDay.avgWpm}</span> avg WPM
              </>
            ) : (
              <span className="text-subtext">No typing activity</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
