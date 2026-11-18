"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Calendar,
  Compass,
  Crown,
  Flag,
  Flame,
  Lock,
  PenTool,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/api-config";

interface BadgeItem {
  _id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  criteria?: Record<string, unknown>;
  xpReward: number;
  unlocked: boolean;
}

interface BadgesTabProps {
  token: string | null;
}

// Map badge icons to Lucide icons
function renderBadgeIcon(iconName?: string, unlocked = false) {
  const iconClass = `h-6 w-6 ${unlocked ? "text-main" : "text-subtext/50"}`;
  switch (iconName?.toLowerCase()) {
    case "flag":
      return <Flag className={iconClass} />;
    case "compass":
      return <Compass className={iconClass} />;
    case "shield":
      return <Shield className={iconClass} />;
    case "crown":
      return <Crown className={iconClass} />;
    case "zap":
      return <Zap className={iconClass} />;
    case "flame":
      return <Flame className={iconClass} />;
    case "sparkles":
      return <Sparkles className={iconClass} />;
    case "target":
      return <Target className={iconClass} />;
    case "trophy":
      return <Trophy className={iconClass} />;
    case "calendar":
      return <Calendar className={iconClass} />;
    case "pentool":
      return <PenTool className={iconClass} />;
    case "award":
    default:
      return <Award className={iconClass} />;
  }
}

export function BadgesTab({ token }: BadgesTabProps) {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalBadges, setTotalBadges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    setLoading(true);

    fetch(`${API_URL}/api/stats/badges`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isCurrent) return;
        if (data) {
          setBadges(data.badges || []);
          setUnlockedCount(data.unlockedCount || 0);
          setTotalBadges(data.totalBadges || 0);
        }
      })
      .catch((err) => console.warn("[badges-tab] Fetch error:", err))
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-main" />
            <h3 className="font-mono text-sm font-semibold tracking-wide text-text uppercase">
              Achievements & Badges
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-subtext">
            Unlock trophies and earn extra XP as you reach typing milestones
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-full border border-main/40 bg-main/15 px-3 py-1 font-bold text-main">
            {unlockedCount} / {totalBadges} Unlocked
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-surface font-mono text-xs text-subtext">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-main" />
          Loading your badges...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <div
              key={b.slug}
              className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                b.unlocked
                  ? "border-main/50 bg-surface shadow-[0_0_15px_rgba(226,183,20,0.08)]"
                  : "border-border/70 bg-surface/60 opacity-65 grayscale hover:grayscale-0 hover:opacity-90"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon box */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                    b.unlocked
                      ? "border-main/40 bg-main/15 shadow-sm"
                      : "border-border bg-surface-2/60"
                  }`}
                >
                  {renderBadgeIcon(b.icon, b.unlocked)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-mono text-sm font-bold ${
                        b.unlocked ? "text-text" : "text-subtext"
                      }`}
                    >
                      {b.name}
                    </h4>
                    {!b.unlocked && <Lock className="h-3.5 w-3.5 text-subtext/70 shrink-0" />}
                  </div>

                  <p className="text-xs text-subtext leading-relaxed">
                    {b.description || "Complete typing tests to unlock this milestone."}
                  </p>

                  <div className="flex items-center justify-between pt-2 font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        b.unlocked ? "text-correct" : "text-subtext/70"
                      }`}
                    >
                      +{b.xpReward} XP
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        b.unlocked
                          ? "bg-correct/15 text-correct font-semibold"
                          : "bg-surface-2 text-subtext"
                      }`}
                    >
                      {b.unlocked ? "Earned" : "Locked"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
