"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console or monitoring service
    console.error("Global application error boundary caught:", error);
  }, [error]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-lg text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-error/10 border border-error/30 flex items-center justify-center text-error shadow-xl shadow-error/10">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-error/30 bg-error/10 text-error text-xs font-mono">
            <span>UNEXPECTED RUNTIME EXCEPTION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
            Something went wrong
          </h1>
          <p className="text-sm text-subtext leading-relaxed max-w-md mx-auto">
            An unexpected error occurred while rendering this view. Your saved local progress and settings remain safe.
          </p>
        </div>

        {error?.message && (
          <div className="text-left rounded-xl border border-border bg-surface-2 p-4 text-xs font-mono text-subtext overflow-x-auto max-h-36">
            <span className="text-error font-semibold">Error: </span>
            {error.message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            variant="primary"
            className="gap-2 shadow-lg shadow-main/15 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/">
            <Button variant="secondary" className="gap-2 cursor-pointer">
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
