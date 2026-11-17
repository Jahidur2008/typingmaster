import { type ReactNode, type ElementType } from "react";
import { Inbox } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  children,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-border bg-surface/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="h-14 w-14 rounded-2xl bg-surface-2 border border-border flex items-center justify-center text-subtext shadow-sm">
        <Icon className="h-7 w-7 text-subtext/80" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-bold text-base text-text">{title}</h3>
        <p className="text-xs sm:text-sm text-subtext leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel || children) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && (
            actionHref ? (
              <a href={actionHref}>
                <Button variant="primary" size="sm" className="cursor-pointer">
                  {actionLabel}
                </Button>
              </a>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onAction}
                className="cursor-pointer"
              >
                {actionLabel}
              </Button>
            )
          )}
          {children}
        </div>
      )}
    </div>
  );
}
