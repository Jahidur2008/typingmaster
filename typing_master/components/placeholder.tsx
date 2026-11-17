import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { AmbientBackground } from "@/components/ambient-background";
import { buttonClasses } from "@/components/ui/button";

type PlaceholderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Optional chips listing planned features, e.g. ["WPM history", "Accuracy"] */
  features?: string[];
  children?: ReactNode;
};

export function Placeholder({
  icon: Icon,
  title,
  description,
  features = [],
  children,
}: PlaceholderProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <AmbientBackground />

      <div className="relative flex max-w-xl flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface shadow-lg">
          <Icon className="h-7 w-7 text-main" strokeWidth={1.8} />
        </div>

        <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-main/30 bg-main/10 px-3 py-1 font-mono text-[11px] font-medium tracking-widest text-main uppercase">
          coming soon
        </span>

        <h1 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-subtext sm:text-base">
          {description}
        </p>

        {features.length > 0 && (
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-subtext"
              >
                {feature}
              </li>
            ))}
          </ul>
        )}

        {children && <div className="mt-8 w-full">{children}</div>}

        <Link
          href="/"
          className={`${buttonClasses({ variant: "secondary", size: "md" })} mt-10`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to test
        </Link>
      </div>
    </div>
  );
}
