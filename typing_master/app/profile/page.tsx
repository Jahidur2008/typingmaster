"use client";

import { useState } from "react";
import {
  Award,
  Check,
  Globe,
  Loader2,
  LogOut,
  Mail,
  Save,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AmbientBackground } from "@/components/ambient-background";
import { Button } from "@/components/ui/button";

function ProfileEditForm({
  initialName,
  initialCountry,
  onSave,
  onLogout,
}: {
  initialName: string;
  initialCountry: string;
  onSave: (name: string, country: string) => Promise<void>;
  onLogout: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState(initialCountry);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await onSave(name.trim(), country.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-text">Edit Profile Details</h2>
      <p className="mt-1 text-xs text-subtext">
        Update your public display name and country. Changes will sync immediately to MongoDB.
      </p>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
          {errorMessage}
        </div>
      )}

      {savedSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-correct/30 bg-correct/10 p-3 text-xs text-correct">
          <Check className="h-4 w-4" />
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="profile-name"
            className="block font-mono text-xs font-medium text-subtext uppercase"
          >
            Display Name
          </label>
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name"
              required
              className="w-full rounded-lg border border-border bg-surface-2/60 px-3.5 py-2.5 pl-10 text-sm text-text outline-none transition-colors focus:border-main focus:ring-1 focus:ring-main/30"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-country"
            className="block font-mono text-xs font-medium text-subtext uppercase"
          >
            Country / Region
          </label>
          <div className="relative mt-1.5">
            <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
            <input
              id="profile-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. United States, Bangladesh"
              className="w-full rounded-lg border border-border bg-surface-2/60 px-3.5 py-2.5 pl-10 text-sm text-text outline-none transition-colors focus:border-main focus:ring-1 focus:ring-main/30"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs text-error/80 transition-colors hover:bg-error/10 hover:text-error"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileContent() {
  const { user, mongoUser, updateUserProfile, logout } = useAuth();

  const level = mongoUser?.level || 1;
  const currentXp = mongoUser?.xp || 0;
  // Next level threshold based on level formula: xp = (level)^2 * 50
  const nextLevelXp = Math.pow(level, 2) * 50;
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 50;
  const xpInCurrentLevel = Math.max(0, currentXp - currentLevelBaseXp);
  const xpNeededForLevel = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const progressPercent = Math.min(
    100,
    Math.round((xpInCurrentLevel / xpNeededForLevel) * 100),
  );

  const displayName = mongoUser?.name || user?.displayName || user?.email?.split("@")[0] || "Typist";
  const avatarUrl = mongoUser?.photo || user?.photoURL;
  const initial = (displayName[0] || "U").toUpperCase();

  const handleSave = async (name: string, country: string) => {
    await updateUserProfile({ name, country });
  };

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <AmbientBackground />

      <div className="relative w-full max-w-3xl space-y-8">
        {/* Profile Card Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xl sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-24 w-24 rounded-full border-2 border-main/50 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-main/50 bg-main/20 font-mono text-3xl font-bold text-main shadow-lg">
                {initial}
              </div>
            )}

            {/* User details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h1 className="text-2xl font-bold text-text sm:text-3xl">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-main/40 bg-main/15 px-3 py-0.5 font-mono text-xs font-bold text-main">
                  Level {level}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-subtext sm:justify-start">
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
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-main" />
                  {mongoUser?.role === "admin" ? "Admin" : "Verified Typist"}
                </span>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-subtext">Experience Progress</span>
                  <span className="text-text">
                    {currentXp} / {nextLevelXp} XP ({progressPercent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-main transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-main">
              <Zap className="h-5 w-5" />
              <span className="font-typing text-3xl font-bold">{level}</span>
            </div>
            <div className="mt-1 font-mono text-xs tracking-wider text-subtext uppercase">
              Current Level
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-correct">
              <Sparkles className="h-5 w-5" />
              <span className="font-typing text-3xl font-bold">{currentXp}</span>
            </div>
            <div className="mt-1 font-mono text-xs tracking-wider text-subtext uppercase">
              Total XP Earned
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-text">
              <Award className="h-5 w-5 text-main" />
              <span className="font-typing text-3xl font-bold">
                {mongoUser?.badges?.length || 0}
              </span>
            </div>
            <div className="mt-1 font-mono text-xs tracking-wider text-subtext uppercase">
              Badges Unlocked
            </div>
          </div>
        </div>

        {/* Edit Profile Form with key to sync on user change */}
        <ProfileEditForm
          key={`${mongoUser?._id || user?.uid}-${mongoUser?.name || ""}-${mongoUser?.country || ""}`}
          initialName={mongoUser?.name || user?.displayName || ""}
          initialCountry={mongoUser?.country || ""}
          onSave={handleSave}
          onLogout={logout}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute fallbackMessage="Loading profile...">
      <ProfileContent />
    </ProtectedRoute>
  );
}
