import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Cpu,
  Globe,
  Heart,
  Keyboard,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Typing Master — the philosophy, bilingual touch-typing curriculum, real-time racing engine, and the tech stack behind it.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Sub-millisecond Flow",
    description:
      "A distraction-free typing engine with zero ads, instantaneous live WPM calculation, raw speed metrics, and precision accuracy telemetry.",
  },
  {
    icon: Globe,
    title: "English & Bengali Bilingualism",
    description:
      "Comprehensive curriculum and drills for standard English QWERTY, as well as Bengali Avro Phonetic and Bijoy layouts.",
  },
  {
    icon: Trophy,
    title: "Real-time Live Racing",
    description:
      "Multiplayer racing powered by Socket.io. Host private rooms with 6-digit codes or quick-match with racers around the globe.",
  },
  {
    icon: Award,
    title: "Aggregated Global Leaderboard",
    description:
      "MongoDB aggregation pipeline tracking all-time, daily, weekly, monthly, and country-level typist rankings and personal bests.",
  },
  {
    icon: BookOpen,
    title: "Touch Typing Curriculum",
    description:
      "Structured courses taking you from home-row foundation to numbers, symbols, speed mastery, and native Bengali scripts.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Admin & Security",
    description:
      "Full role-based control center with maintenance mode, word database imports, user management, and live site settings.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] px-4 py-12 sm:px-6 lg:px-8">
      <AmbientBackground />

      <div className="mx-auto max-w-5xl space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-main/30 bg-main/10 px-4 py-1.5 text-xs font-mono text-main">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built by typists, for typists</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl lg:text-6xl">
            Type faster. <span className="text-main">Think clearer.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-subtext sm:text-lg leading-relaxed">
            Typing Master is an open, modern, distraction-free typing platform designed to help
            you develop subconscious touch-typing muscle memory in both English and Bengali.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/">
              <Button variant="primary" className="gap-2 shadow-lg shadow-main/10">
                <Keyboard className="h-4 w-4" />
                <span>Start Typing Test</span>
              </Button>
            </Link>
            <Link href="/learn">
              <Button variant="ghost" className="gap-2 text-subtext hover:text-text">
                <BookOpen className="h-4 w-4" />
                <span>Explore Lessons</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Philosophy Card */}
        <div className="rounded-3xl border border-border bg-surface/70 backdrop-blur-md p-8 sm:p-10 shadow-2xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-main uppercase tracking-widest font-bold">
                <Cpu className="h-4 w-4" />
                <span>Our Philosophy</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
                Pure Focus. Zero Friction.
              </h2>
              <p className="text-sm text-subtext leading-relaxed">
                Most typing tests on the web are cluttered with distracting banner ads, slow animations, and rigid exercises.
                Typing Master strips all that away: the moment you press a key, the timer starts.
                When you make a mistake, instant visual telemetry highlights the exact letter and computes your raw vs net velocity.
              </p>
              <p className="text-sm text-subtext leading-relaxed">
                Whether you are a developer looking to hit 120 WPM, a writer seeking effortless flow, or a student mastering
                Bengali keyboard layouts, Typing Master gives you the tools to excel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-surface-2 p-5 text-center space-y-1">
                <div className="text-3xl font-black text-main">11+</div>
                <div className="text-xs font-mono text-subtext uppercase">Theme Presets</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-5 text-center space-y-1">
                <div className="text-3xl font-black text-main">2</div>
                <div className="text-xs font-mono text-subtext uppercase">Languages Supported</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-5 text-center space-y-1">
                <div className="text-3xl font-black text-main">&lt; 1ms</div>
                <div className="text-xs font-mono text-subtext uppercase">Input Latency</div>
              </div>
              <div className="rounded-2xl border border-border bg-surface-2 p-5 text-center space-y-1">
                <div className="text-3xl font-black text-main">100%</div>
                <div className="text-xs font-mono text-subtext uppercase">Free & Ad-Free</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
              Platform Features
            </h2>
            <p className="text-xs sm:text-sm text-subtext font-mono">
              Engineered with modern web technologies for peak typing performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-6 hover:border-main/40 transition-all space-y-3 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-main/10 border border-main/30 flex items-center justify-center text-main group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-base text-text">{f.title}</h3>
                  <p className="text-xs text-subtext leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to action */}
        <div className="rounded-3xl border border-main/30 bg-main/5 p-8 sm:p-12 text-center space-y-4">
          <Heart className="h-8 w-8 text-main mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
            Ready to test your typing speed?
          </h2>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-subtext leading-relaxed">
            Jump straight into a 15, 30, or 60-second test, challenge fellow typists in a live competition,
            or master touch-typing fundamentals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/">
              <Button variant="primary">Start Practice Test</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="text-subtext hover:text-text">
                Send Us Feedback
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
