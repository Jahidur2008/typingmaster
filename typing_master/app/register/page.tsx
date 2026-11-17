"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
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
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in instead.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      default:
        return (err as { message?: string }).message || "Failed to create account. Please try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/profile";

  const { user, loading, signUpWithEmail, signInWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
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
      await signInWithGoogle();
      router.push(redirectPath);
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
        title="Create your account"
        subtitle="Join Typing Master to sync personal bests and level up."
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
          label="Sign up with Google"
        />

        <FormDivider />

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Display Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SpeedyFingers"
            required
            autoComplete="name"
            icon={<User className="h-4 w-4" />}
          />

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
            placeholder="At least 6 characters"
            required
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
          />

          <FormInput
            label="Confirm Password"
            isPassword
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            required
            autoComplete="new-password"
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-subtext">
          Already have an account?{" "}
          <Link
            href={`/login${redirectPath !== "/profile" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
            className="font-medium text-main hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-main" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
