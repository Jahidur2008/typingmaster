"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const CATEGORIES = [
  { id: "general", label: "General Inquiry", icon: HelpCircle },
  { id: "bug", label: "Bug Report", icon: Bug },
  { id: "feature", label: "Feature Suggestion", icon: Sparkles },
  { id: "partnership", label: "Partnership / Business", icon: MessageSquare },
  { id: "other", label: "Other", icon: Mail },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Please provide a subject for your message.");
      return;
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      setError("Please enter a message of at least 10 characters.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message");
      }

      setSubmitted(true);
      setReferenceId(data.id || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "general",
      message: "",
    });
    setSubmitted(false);
    setError(null);
    setReferenceId(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-12 sm:px-6 lg:px-8">
      <AmbientBackground />

      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-4 py-1.5 text-xs font-mono text-main">
            <Mail className="h-3.5 w-3.5" />
            <span>We read every message</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text">
            Get in touch with us
          </h1>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-subtext leading-relaxed">
            Found a bug, want to request a feature, or have feedback about Bengali typing layouts?
            Drop us a message and our team will get back to you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact info & quick cards */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-6 space-y-5 shadow-xl">
              <h2 className="font-bold text-base text-text">Direct Channels</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-main/10 border border-main/30 flex items-center justify-center text-main shrink-0 mt-0.5">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-subtext uppercase">Support Email</div>
                    <a
                      href="mailto:support@typingmaster.local"
                      className="text-xs font-bold text-text hover:text-main transition-colors"
                    >
                      support@typingmaster.local
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-main/10 border border-main/30 flex items-center justify-center text-main shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-subtext uppercase">Response Time</div>
                    <div className="text-xs font-bold text-text">Within 24–48 Hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-main/10 border border-main/30 flex items-center justify-center text-main shrink-0 mt-0.5">
                    <GithubIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-subtext uppercase">GitHub & Issues</div>
                    <div className="text-xs font-bold text-text">Public Issue Tracker</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 text-xs text-subtext leading-relaxed">
                Messages submitted through this form are stored securely in MongoDB and directly accessible in the
                Administrator Control Center.
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-2.5">
              <div className="text-xs font-bold text-text flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-main" />
                <span>Feature Requests</span>
              </div>
              <p className="text-xs text-subtext leading-relaxed">
                Want a new language layout or custom typing test mode? Select &quot;Feature Suggestion&quot;
                and detail how you envision it.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Form or Success Card */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="rounded-3xl border border-correct/40 bg-surface/80 backdrop-blur-md p-8 sm:p-12 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="h-16 w-16 rounded-full bg-correct/10 border border-correct/30 flex items-center justify-center text-correct mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-text">
                  Message Sent Successfully!
                </h3>
                <p className="mx-auto max-w-md text-sm text-subtext leading-relaxed">
                  Thank you, <strong className="text-text">{formData.name}</strong>. Your message has been safely saved in our database.
                  Our team will review your inquiry and follow up at <strong className="text-text">{formData.email}</strong>.
                </p>
                {referenceId && (
                  <div className="inline-block rounded-xl border border-border bg-surface-2 px-4 py-2 font-mono text-xs text-subtext">
                    Reference ID: <span className="text-main font-bold">{referenceId}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <Button onClick={handleReset} variant="ghost" className="text-subtext hover:text-text">
                    Send Another Message
                  </Button>
                  <Link href="/">
                    <Button variant="primary">Return to Typing Test</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-border bg-surface/70 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-2xl"
              >
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-error/40 bg-error/10 p-3.5 text-xs text-error font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-text uppercase">
                      Your Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-subtext/50 focus:border-main focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-text uppercase">
                      Email Address <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-subtext/50 focus:border-main focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-text uppercase">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-text focus:border-main focus:outline-none transition-colors cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-text uppercase">
                      Subject <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Brief summary of your inquiry"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-subtext/50 focus:border-main focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-text uppercase">
                    Your Message <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us what's on your mind... (minimum 10 characters)"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text placeholder:text-subtext/50 focus:border-main focus:outline-none transition-colors resize-y"
                  />
                  <div className="text-[11px] font-mono text-subtext text-right">
                    {formData.message.length} / 3000 chars
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-subtext">
                    All messages are monitored by our admin team.
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="gap-2 shadow-lg shadow-main/15 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
