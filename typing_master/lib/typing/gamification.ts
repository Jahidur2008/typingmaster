/**
 * Client gamification utilities: Level calculations, progress bars, and badge types.
 */

export interface BadgeItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  xpReward: number;
  unlocked?: boolean;
}

export interface ChallengeItem {
  _id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly" | "speed" | "accuracy";
  mode: "time" | "words" | "quote" | "custom" | "zen" | "random";
  text: string;
  targetWpm: number;
  targetAccuracy: number;
  duration?: number;
  wordCount?: number;
  xpReward: number;
  badgeReward?: BadgeItem;
  endsAt?: string;
  startsAt?: string;
  completed?: boolean;
  attemptsCount?: number;
  userBestWpm?: number;
  userBestAccuracy?: number;
}

/**
 * Calculates user level from total XP.
 * Level 1: 0 XP
 * Level 2: 50 XP
 * Level 3: 200 XP
 * Level 4: 450 XP, etc.
 */
export function getLevelFromXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt((xp || 0) / 50)) + 1);
}

/**
 * Returns total XP required to reach a specific level.
 */
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 50;
}

/**
 * Returns level progress details:
 * - currentLevel
 * - currentLevelBaseXp
 * - nextLevelXp
 * - xpIntoCurrentLevel
 * - xpNeededForNextLevel
 * - progressPercent (0-100)
 */
export function getLevelProgress(totalXp = 0) {
  const currentLevel = getLevelFromXp(totalXp);
  const currentBaseXp = getXpRequiredForLevel(currentLevel);
  const nextLevelXp = getXpRequiredForLevel(currentLevel + 1);
  const range = nextLevelXp - currentBaseXp;
  const currentProgressXp = Math.max(0, totalXp - currentBaseXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentProgressXp / range) * 100)));

  return {
    currentLevel,
    currentBaseXp,
    nextLevelXp,
    currentProgressXp,
    xpRemaining: nextLevelXp - totalXp,
    progressPercent,
  };
}

/**
 * Format remaining countdown time until a Date string.
 */
export function formatCountdown(targetDateStr?: string): string {
  if (!targetDateStr) return "Ongoing";
  const diff = new Date(targetDateStr).getTime() - Date.now();
  if (diff <= 0) return "Ending soon";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
