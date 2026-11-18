"use client";

import { useMemo } from "react";
import { Edit3, Flame, Globe, Mail, Shield, Trophy } from "lucide-react";
import type { MongoUser } from "@/lib/auth-context";
import type { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  user: FirebaseUser | null;
  mongoUser: MongoUser | null;
  onEditProfile: () => void;
}

export function ProfileHeader({
  user,
  mongoUser,
  onEditProfile,
}: ProfileHeaderProps) {
  const level = mongoUser?.level || 1;
  const currentXp = mongoUser?.xp || 0;

  // Level thresholds: XP = level^2 * 50
  const nextLevelXp = Math.pow(level, 2) * 50;
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
  const xpInCurrentLevel = Math.max(0, currentXp - currentLevelBaseXp);
  const xpNeededForLevel = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const progressPercent = Math.min(
    100,
    Math.round((xpInCurrentLevel / xpNeededForLevel) * 100),
  );

  const displayName =
    mongoUser?.name || user?.displayName || user?.email?.split("@")[0] || "Typist";
  const avatarUrl = mongoUser?.photo || user?.photoURL;
  const initial = (displayName[0] || "U").toUpperCase();

  const joinDate = useMemo(() => {
    const raw = mongoUser?.createdAt || user?.metadata?.creationTime;
    if (!raw) return "Member";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Member";
    return `Joined ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  }, [mongoUser?.createdAt, user?.metadata?.creationTime]);

  const currentStreak = mongoUser?.streak?.current || 0;
  const bestStreak = mongoUser?.streak?.best || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xl sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative mx-auto shrink-0 sm:mx-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-24 w-24 rounded-full border-2 border-main/60 object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-main/60 bg-main/20 font-mono text-3xl font-bold text-main shadow-lg">
              {initial}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-main font-mono text-xs font-bold text-bg shadow-sm">
            {level}
          </span>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                <h1 className="text-2xl font-bold text-text sm:text-3xl">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-main/40 bg-main/15 px-3 py-0.5 font-mono text-xs font-bold text-main">
                  Level {level}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-subtext">
                  <Shield className="h-3 w-3 text-main" />
                  {mongoUser?.role === "admin" ? "Admin" : "Verified Typist"}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-xs text-subtext sm:justify-start">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                {mongoUser?.country && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    {mongoUser.country}
                  </span>
                )}
                <span>•</span>
                <span>{joinDate}</span>
              </div>
            </div>

            {/* Streak & Edit Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-main/30 bg-main/10 px-3.5 py-2 font-mono">
                <Flame className="h-5 w-5 text-main animate-pulse" />
                <div className="text-left leading-tight">
                  <div className="text-sm font-bold text-text">{currentStreak}d streak</div>
                  <div className="text-[10px] text-subtext">best: {bestStreak}d</div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={onEditProfile}
                className="gap-1.5 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-subtext flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-main" />
                XP Progress to Level {level + 1}
              </span>
              <span className="text-text font-semibold">
                {currentXp} / {nextLevelXp} XP ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-main transition-all duration-500 shadow-[0_0_8px_rgba(226,183,20,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
