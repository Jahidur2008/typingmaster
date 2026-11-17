import { API_URL } from "@/lib/api-config";

export interface LessonProgressItem {
  lessonId: string;
  completed: boolean;
  wpm: number;
  accuracy: number;
  attempts: number;
  completedAt?: string;
}

const GUEST_LESSONS_KEY = "tm-guest-lessons";

export function getGuestLessonProgress(): Record<string, LessonProgressItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GUEST_LESSONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveGuestLessonProgress(
  lessonId: string,
  wpm: number,
  accuracy: number,
  passed: boolean,
): LessonProgressItem {
  const current = getGuestLessonProgress();
  const prev = current[lessonId];

  const updatedItem: LessonProgressItem = {
    lessonId,
    completed: Boolean(prev?.completed || passed),
    wpm: Math.max(wpm, prev?.wpm || 0),
    accuracy: Math.max(accuracy, prev?.accuracy || 0),
    attempts: (prev?.attempts || 0) + 1,
    completedAt: passed ? new Date().toISOString() : prev?.completedAt,
  };

  current[lessonId] = updatedItem;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(GUEST_LESSONS_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }

  return updatedItem;
}

export async function submitLessonComplete(
  lessonId: string,
  wpm: number,
  accuracy: number,
  token?: string | null,
) {
  if (token) {
    const res = await fetch(`${API_URL}/api/lessons/lesson/${lessonId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ wpm, accuracy }),
    });

    if (res.ok) {
      return res.json();
    }
  }

  // Guest fallback
  const passed = accuracy >= 90;
  const progress = saveGuestLessonProgress(lessonId, wpm, accuracy, passed);
  return {
    success: true,
    passed,
    progress,
    xpEarned: passed ? 50 : 0,
  };
}
