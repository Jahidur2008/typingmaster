import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-main text-bg hover:brightness-110 focus-visible:outline-main",
  secondary:
    "bg-surface-2 text-text hover:bg-main hover:text-bg focus-visible:outline-subtext",
  ghost:
    "bg-transparent text-subtext hover:text-text focus-visible:outline-subtext",
  danger: "bg-error text-text hover:brightness-110 focus-visible:outline-error",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-all duration-150 select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-all duration-150 select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "active:scale-[0.98]",
    variants[variant],
    sizes[size],
    className,
  );
}
