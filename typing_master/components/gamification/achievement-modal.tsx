"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Calendar,
  Compass,
  Crown,
  Flame,
  PenTool,
  Shield,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import type { BadgeItem } from "@/lib/typing/gamification";
import { Button } from "@/components/ui/button";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag: Award,
  Compass,
  Shield,
  Award,
  Crown,
  Zap,
  Flame,
  Sparkles,
  Target,
  Trophy,
  Calendar,
  PenTool,
};

export interface AchievementCelebration {
  type: "badge" | "level";
  badge?: BadgeItem;
  level?: number;
  xpEarned?: number;
}

export function AchievementModal({
  celebration,
  onClose,
}: {
  celebration: AchievementCelebration | null;
  onClose: () => void;
}) {
  if (!celebration) return null;

  const isLevel = celebration.type === "level";
  const IconComponent =
    celebration.badge?.icon && BADGE_ICONS[celebration.badge.icon]
      ? BADGE_ICONS[celebration.badge.icon]
      : Trophy;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      >
        <motion.div
          key="achievement-card"
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          className="relative w-full max-w-sm rounded-3xl border border-main/40 bg-surface p-6 text-center shadow-2xl shadow-main/20 sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-subtext transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"
            aria-label="Close celebration"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Glowing Animated Icon */}
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-main/50"
            />
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-main bg-main/20 text-main shadow-lg shadow-main/30"
            >
              {isLevel ? (
                <Sparkles className="h-8 w-8 text-main" />
              ) : (
                <IconComponent className="h-8 w-8 text-main" />
              )}
            </motion.div>
          </div>

          {/* Subheader Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-main/40 bg-main/15 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-main"
          >
            <Sparkles className="h-3 w-3" />
            {isLevel ? "Level Up!" : "Badge Unlocked!"}
          </motion.div>

          {/* Title & Description */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-3 text-2xl font-bold text-text"
          >
            {isLevel
              ? `Reached Level ${celebration.level}`
              : celebration.badge?.name}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-xs text-subtext leading-relaxed"
          >
            {isLevel
              ? "Your dedication to daily typing practice has paid off. Keep training to unlock higher master ranks!"
              : celebration.badge?.description}
          </motion.p>

          {/* XP Reward Chip */}
          {celebration.badge?.xpReward ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-correct/40 bg-correct/15 px-3 py-1 font-mono text-xs font-bold text-correct"
            >
              <Award className="h-3.5 w-3.5" />
              +{celebration.badge.xpReward} Bonus XP
            </motion.div>
          ) : null}

          {/* Claim / Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Button onClick={onClose} className="w-full">
              Awesome, Continue!
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
