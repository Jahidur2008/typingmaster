"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  AuthCard,
  FormInput,
  GoogleSignInButton,
  FormDivider,
} from "@/components/auth/auth-form";
import { AmbientBackground } from "@/components/ambient-background";

function getFriendlyErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please reset your password or wait a few minutes.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Browser popup was blocked. Switching to Google redirect...";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase Console. Please add this Vercel domain under Firebase Console -> Authentication -> Settings -> Authorized Domains.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      default:
        return (err as { message?: string }).message || "Failed to sign in. Please try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/profile";

  const { user, loading, signInWithEmail, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithEmail(email.trim(), password);
      router.push(redirectPath);
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const u = await signInWithGoogle();
      if (u && u.uid) {
        router.push(redirectPath);
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <AmbientBackground />

      <AuthCard
        title="Welcome back"
        subtitle="Sign in to save your typing tests, track stats, and compete."
      >
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 p-3.5 text-xs text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Google sign-in */}
        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          label="Sign in with Google"
        />

        <FormDivider />

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            icon={<Mail className="h-4 w-4" />}
          />

          <FormInput
            label="Password"
            isPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            icon={<Lock className="h-4 w-4" />}
          />

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-main px-4 py-2.5 text-sm font-semibold text-bg shadow-sm transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-subtext">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${redirectPath !== "/profile" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="font-medium text-main hover:underline"
          >
            Create account
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-main" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
