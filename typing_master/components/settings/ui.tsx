"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Small building blocks for the settings screen.                     */
/* ------------------------------------------------------------------ */

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-mono text-sm font-bold tracking-widest text-main uppercase">
        {title}
      </h2>
      {description && (
        <p className="mt-1 font-mono text-xs text-subtext">{description}</p>
      )}
      <div className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

export function Row({
  label,
  hint,
  children,
  stacked,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        stacked && "flex-col items-stretch gap-3",
      )}
    >
      <div className="shrink-0">
        <div className="font-mono text-sm text-text">{label}</div>
        {hint && <div className="mt-0.5 font-mono text-xs text-subtext">{hint}</div>}
      </div>
      <div className={cn("flex items-center gap-3", stacked && "justify-start")}>
        {children}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-150",
        checked ? "bg-main" : "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-bg shadow transition-transform duration-150",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
            value === opt.value
              ? "bg-main font-bold text-bg"
              : "text-subtext hover:text-text",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-surface-2 accent-main sm:w-52"
      />
      <span className="w-14 text-right font-mono text-xs text-text">
        {value}
        {suffix}
      </span>
    </div>
  );
}

export function SelectField<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value as T)}
      className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text outline-none focus:outline-main"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2 transition-colors hover:border-main/50">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color`}
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <span className="font-mono text-xs text-text">{label}</span>
      <span className="ml-auto font-mono text-[10px] text-subtext uppercase">
        {value}
      </span>
    </label>
  );
}
