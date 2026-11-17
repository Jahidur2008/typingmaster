import { cn } from "@/lib/utils";

/**
 * Ambient page background: an aceternity-style dot grid fading radially,
 * plus a soft accent glow. Pure CSS — cheap and distraction-free.
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div className="bg-grid mask-fade-radial absolute inset-0" />
      <div className="glow-accent absolute inset-x-0 top-0 h-[420px]" />
    </div>
  );
}
