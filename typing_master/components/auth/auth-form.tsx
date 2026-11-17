"use client";

import {
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 21st.dev inspired container with ambient glow and clean dark borders.
 */
export function AuthCard({
  children,
  title,
  subtitle,
  className,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full max-w-md", className)}>
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-3xl bg-radial from-main/15 via-transparent to-transparent opacity-80 blur-xl"
      />

      <div className="relative rounded-2xl border border-border bg-surface/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-subtext">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

/**
 * Modern input with leading icon, sleek focus outline, and optional password reveal.
 */
interface FormInputProps extends ComponentProps<"input"> {
  label: string;
  icon?: ReactNode;
  isPassword?: boolean;
  error?: string;
}

export function FormInput({
  label,
  icon,
  isPassword,
  error,
  className,
  type = "text",
  id,
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 text-left">
      <label
        htmlFor={inputId}
        className="block font-mono text-xs font-medium tracking-wide text-subtext uppercase"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-subtext transition-colors group-focus-within:text-main">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={inputType}
          className={cn(
            "w-full rounded-lg border border-border bg-surface-2/60 px-3.5 py-2.5 text-sm text-text placeholder-subtext/60 transition-all duration-200 outline-none",
            "focus:border-main focus:bg-surface-2 focus:ring-2 focus:ring-main/20",
            icon ? "pl-10" : "",
            isPassword ? "pr-10" : "",
            error ? "border-error focus:border-error focus:ring-error/20" : "",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-subtext transition-colors hover:text-text"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="font-mono text-xs text-error transition-opacity">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Premium Google Sign-In button with SVG mark and hover feedback.
 */
export function GoogleSignInButton({
  onClick,
  disabled,
  loading,
  label = "Continue with Google",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-border bg-surface-2/80 px-4 py-2.5 text-sm font-medium text-text transition-all duration-150",
        "hover:border-main/50 hover:bg-surface-2 hover:text-main",
        "active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-main" />
      ) : (
        <svg
          className="h-4.5 w-4.5 shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}

/**
 * Centered divider with text.
 */
export function FormDivider({ text = "or continue with email" }: { text?: string }) {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <span className="relative bg-surface px-3 font-mono text-[11px] tracking-wider text-subtext uppercase">
        {text}
      </span>
    </div>
  );
}
