import Link from "next/link";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Keyboard, Sparkles, Trophy } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-xl text-center space-y-8">
        {/* 404 Keycap Graphic */}
        <div className="flex justify-center items-center gap-3">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-surface border-2 border-border shadow-[0_8px_0_0_rgba(0,0,0,0.35)] flex flex-col items-center justify-center transform -rotate-6 transition-transform hover:rotate-0 hover:scale-105">
            <span className="text-[10px] font-mono text-subtext/60 font-bold self-start pl-2 pt-1">ESC</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-main">4</span>
          </div>

          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-surface-2 border-2 border-main/50 shadow-[0_8px_0_0_rgba(0,0,0,0.35)] flex flex-col items-center justify-center transform rotate-3 transition-transform hover:rotate-0 hover:scale-105">
            <span className="text-[10px] font-mono text-main/60 font-bold self-start pl-2 pt-1">MISS</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-text">0</span>
          </div>

          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-surface border-2 border-border shadow-[0_8px_0_0_rgba(0,0,0,0.35)] flex flex-col items-center justify-center transform rotate-6 transition-transform hover:rotate-0 hover:scale-105">
            <span className="text-[10px] font-mono text-subtext/60 font-bold self-start pl-2 pt-1">ERR</span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-main">4</span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-error/30 bg-error/10 text-error text-xs font-mono">
            <span>KEYSTROKE OUT OF BOUNDS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-text">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-subtext max-w-md mx-auto leading-relaxed">
            The key sequence you pressed does not map to any existing page. It might have been relocated, renamed, or vanished into void.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button variant="primary" className="gap-2 shadow-lg shadow-main/15 cursor-pointer">
              <Home className="h-4 w-4" />
              <span>Back to Home Test</span>
            </Button>
          </Link>

          <Link href="/practice">
            <Button variant="secondary" className="gap-2 cursor-pointer">
              <Keyboard className="h-4 w-4" />
              <span>Practice Mode</span>
            </Button>
          </Link>

          <Link href="/leaderboard">
            <Button variant="ghost" className="gap-2 text-subtext hover:text-text cursor-pointer">
              <Trophy className="h-4 w-4" />
              <span>Leaderboard</span>
            </Button>
          </Link>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="text-xs font-mono text-subtext/60 pt-4 flex items-center justify-center gap-2">
          <span>Press</span>
          <kbd className="px-2 py-0.5 rounded border border-border bg-surface-2 text-text font-bold">Esc</kbd>
          <span>or navigate using the top menu</span>
        </div>
      </div>
    </div>
  );
}
