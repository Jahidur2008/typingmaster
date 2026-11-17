export default function RootLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-8 max-w-5xl mx-auto space-y-10 animate-pulse">
      {/* Top test mode configuration bar skeleton */}
      <div className="h-10 w-full max-w-2xl rounded-2xl bg-surface/80 border border-border flex items-center justify-between px-6">
        <div className="flex gap-4">
          <div className="h-3 w-16 bg-surface-2 rounded-md" />
          <div className="h-3 w-16 bg-surface-2 rounded-md" />
          <div className="h-3 w-16 bg-surface-2 rounded-md" />
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-3">
          <div className="h-3 w-8 bg-surface-2 rounded-md" />
          <div className="h-3 w-8 bg-main/40 rounded-md" />
          <div className="h-3 w-8 bg-surface-2 rounded-md" />
        </div>
      </div>

      {/* Live stat counter preview skeleton */}
      <div className="flex items-center gap-6">
        <div className="h-10 w-16 bg-main/20 rounded-xl" />
        <div className="h-4 w-12 bg-surface-2 rounded-md" />
        <div className="h-4 w-12 bg-surface-2 rounded-md" />
      </div>

      {/* Typing word lines skeleton */}
      <div className="w-full max-w-4xl space-y-3.5 px-4">
        <div className="flex flex-wrap gap-3">
          <div className="h-7 w-20 bg-surface-2 rounded-lg" />
          <div className="h-7 w-14 bg-surface-2 rounded-lg" />
          <div className="h-7 w-28 bg-surface-2 rounded-lg" />
          <div className="h-7 w-16 bg-surface-2 rounded-lg" />
          <div className="h-7 w-24 bg-surface-2 rounded-lg" />
          <div className="h-7 w-20 bg-surface-2 rounded-lg" />
          <div className="h-7 w-12 bg-surface-2 rounded-lg" />
          <div className="h-7 w-28 bg-surface-2 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-7 w-16 bg-surface-2/70 rounded-lg" />
          <div className="h-7 w-24 bg-surface-2/70 rounded-lg" />
          <div className="h-7 w-20 bg-surface-2/70 rounded-lg" />
          <div className="h-7 w-28 bg-surface-2/70 rounded-lg" />
          <div className="h-7 w-14 bg-surface-2/70 rounded-lg" />
          <div className="h-7 w-20 bg-surface-2/70 rounded-lg" />
          <div className="h-7 w-16 bg-surface-2/70 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-7 w-24 bg-surface-2/40 rounded-lg" />
          <div className="h-7 w-18 bg-surface-2/40 rounded-lg" />
          <div className="h-7 w-20 bg-surface-2/40 rounded-lg" />
          <div className="h-7 w-14 bg-surface-2/40 rounded-lg" />
          <div className="h-7 w-28 bg-surface-2/40 rounded-lg" />
        </div>
      </div>

      {/* Footer shortcut skeleton */}
      <div className="h-3 w-48 bg-surface-2/60 rounded-md" />
    </div>
  );
}
