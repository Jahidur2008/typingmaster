import { Keyboard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-mono text-lg font-semibold tracking-tight",
        className,
      )}
      aria-label="Typing Master home"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-main text-bg transition-transform duration-200 group-hover:-rotate-6">
        <Keyboard className="h-4.5 w-4.5" strokeWidth={2.4} />
      </span>
      <span>
        typing<span className="text-main">master</span>
      </span>
    </Link>
  );
}
