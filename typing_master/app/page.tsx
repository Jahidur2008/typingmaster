import { AmbientBackground } from "@/components/ambient-background";
import { TypingArea } from "@/components/typing-area";

export default function HomePage() {
  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-16 sm:py-20">
      <AmbientBackground />

      <div className="relative flex w-full max-w-3xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-main/30 bg-main/10 px-3 py-1 font-mono text-[11px] font-medium tracking-widest text-main uppercase">
          v0.1 — preview
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Type faster. <span className="text-main">Think clearer.</span>
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-subtext sm:text-base">
          Just start typing — the test begins on your first keystroke. Space
          submits a word, esc restarts.
        </p>

        <div className="mt-10 w-full">
          <TypingArea />
        </div>
      </div>
    </div>
  );
}
