"use client";

import { useMemo } from "react";
import { getFingerForKey } from "@/lib/typing/fingers";
import { cn } from "@/lib/utils";

/**
 * Hand placement diagram.
 * Renders left and right hands with fingers that highlight
 * based on the character currently required.
 */
export function HandDiagram({
  targetChar,
  className,
}: {
  targetChar?: string | null;
  className?: string;
}) {
  const fingerInfo = useMemo(() => getFingerForKey(targetChar), [targetChar]);

  const activeKey = fingerInfo?.fingerKey; // e.g. "left-index", "right-thumb"

  const isF = (key: string) => activeKey === key;

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      <div className="relative flex items-center justify-center gap-8 sm:gap-14">
        {/* LEFT HAND */}
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 160 170"
            className="h-28 w-28 sm:h-36 sm:w-36 drop-shadow-md"
            aria-label="Left hand diagram"
          >
            <defs>
              <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Palm */}
            <path
              d="M 28 85 C 28 65, 45 60, 65 60 C 95 60, 115 65, 125 90 C 130 115, 120 155, 75 155 C 35 155, 28 115, 28 85 Z"
              fill="var(--surface-2)"
              stroke="var(--border)"
              strokeWidth="2"
            />

            {/* Pinky (Left) */}
            <rect
              x="26"
              y="32"
              width="14"
              height="55"
              rx="7"
              fill={isF("left-pinky") ? "var(--main)" : "var(--surface)"}
              stroke={isF("left-pinky") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("left-pinky") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Ring (Left) */}
            <rect
              x="44"
              y="18"
              width="15"
              height="65"
              rx="7.5"
              fill={isF("left-ring") ? "var(--main)" : "var(--surface)"}
              stroke={isF("left-ring") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("left-ring") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Middle (Left) */}
            <rect
              x="63"
              y="10"
              width="16"
              height="75"
              rx="8"
              fill={isF("left-middle") ? "var(--main)" : "var(--surface)"}
              stroke={isF("left-middle") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("left-middle") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Index (Left) */}
            <rect
              x="83"
              y="18"
              width="16"
              height="68"
              rx="8"
              fill={isF("left-index") ? "var(--main)" : "var(--surface)"}
              stroke={isF("left-index") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("left-index") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Thumb (Left) */}
            <path
              d="M 100 95 C 105 85, 128 85, 138 98 C 145 108, 140 125, 122 130 C 112 132, 100 115, 100 95 Z"
              fill={isF("left-thumb") ? "var(--main)" : "var(--surface)"}
              stroke={isF("left-thumb") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("left-thumb") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />
          </svg>
          <span className="mt-1 font-mono text-[11px] font-medium text-subtext">
            Left Hand
          </span>
        </div>

        {/* RIGHT HAND */}
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 160 170"
            className="h-28 w-28 sm:h-36 sm:w-36 drop-shadow-md"
            aria-label="Right hand diagram"
          >
            {/* Palm */}
            <path
              d="M 132 85 C 132 65, 115 60, 95 60 C 65 60, 45 65, 35 90 C 30 115, 40 155, 85 155 C 125 155, 132 115, 132 85 Z"
              fill="var(--surface-2)"
              stroke="var(--border)"
              strokeWidth="2"
            />

            {/* Thumb (Right) */}
            <path
              d="M 60 95 C 55 85, 32 85, 22 98 C 15 108, 20 125, 38 130 C 48 132, 60 115, 60 95 Z"
              fill={isF("right-thumb") ? "var(--main)" : "var(--surface)"}
              stroke={isF("right-thumb") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("right-thumb") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Index (Right) */}
            <rect
              x="61"
              y="18"
              width="16"
              height="68"
              rx="8"
              fill={isF("right-index") ? "var(--main)" : "var(--surface)"}
              stroke={isF("right-index") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("right-index") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Middle (Right) */}
            <rect
              x="81"
              y="10"
              width="16"
              height="75"
              rx="8"
              fill={isF("right-middle") ? "var(--main)" : "var(--surface)"}
              stroke={isF("right-middle") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("right-middle") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Ring (Right) */}
            <rect
              x="101"
              y="18"
              width="15"
              height="65"
              rx="7.5"
              fill={isF("right-ring") ? "var(--main)" : "var(--surface)"}
              stroke={isF("right-ring") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("right-ring") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />

            {/* Pinky (Right) */}
            <rect
              x="120"
              y="32"
              width="14"
              height="55"
              rx="7"
              fill={isF("right-pinky") ? "var(--main)" : "var(--surface)"}
              stroke={isF("right-pinky") ? "var(--main)" : "var(--border)"}
              strokeWidth="2"
              filter={isF("right-pinky") ? "url(#glow-gold)" : undefined}
              className="transition-colors duration-150"
            />
          </svg>
          <span className="mt-1 font-mono text-[11px] font-medium text-subtext">
            Right Hand
          </span>
        </div>
      </div>

      {/* Dynamic guidance indicator */}
      <div className="mt-2.5 flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1 text-xs">
        {fingerInfo ? (
          <>
            <span className="font-mono text-subtext">Press with:</span>
            <span className="font-semibold text-main">{fingerInfo.label}</span>
            {targetChar === " " && (
              <span className="text-subtext">(Spacebar)</span>
            )}
          </>
        ) : (
          <span className="text-subtext">Rest fingers on home row (A S D F — J K L ;)</span>
        )}
      </div>
    </div>
  );
}
