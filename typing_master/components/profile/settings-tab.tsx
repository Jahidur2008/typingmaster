"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api-config";

interface SettingsTabProps {
  initialName: string;
  initialCountry: string;
  initialPhoto: string;
}

export function SettingsTab({
  initialName,
  initialCountry,
  initialPhoto,
}: SettingsTabProps) {
  const { user, updateUserProfile, logout, getToken } = useAuth();

  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState(initialCountry);
  const [photo, setPhoto] = useState(initialPhoto);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password reset state
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await updateUserProfile({
        name: name.trim(),
        country: country.trim(),
        photo: photo.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    setErrorMessage(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 6000);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Could not send password reset email.");
    } finally {
      setSendingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== "delete my account") {
      setDeleteError("Please type 'delete my account' exactly to confirm.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const idToken = await getToken();
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to delete account from server.");
      }

      // If user is logged into Firebase, attempt firebase delete, else logout
      try {
        await user?.delete();
      } catch {
        // If reauthentication is needed by Firebase, just sign out cleanly
      }

      await logout();
      window.location.href = "/";
    } catch (err: unknown) {
      setDeleteError((err as Error).message || "Failed to complete account deletion.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Profile Details Form */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-bold text-text">Profile Information</h3>
          <p className="mt-1 text-xs text-subtext">
            Update your public display name, country, and avatar image URL.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error font-mono">
            {errorMessage}
          </div>
        )}

        {savedSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-correct/30 bg-correct/10 p-3.5 text-xs text-correct font-mono">
            <Check className="h-4 w-4" />
            Profile updated and synced successfully!
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
          {/* Display Name */}
          <div>
            <label
              htmlFor="settings-name"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-subtext"
            >
              Display Name
            </label>
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 pl-10 text-sm text-text outline-none transition-colors focus:border-main focus:ring-1 focus:ring-main/30"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="settings-country"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-subtext"
            >
              Country / Region
            </label>
            <div className="relative mt-1.5">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
              <input
                id="settings-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Bangladesh, United States"
                className="w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 pl-10 text-sm text-text outline-none transition-colors focus:border-main focus:ring-1 focus:ring-main/30"
              />
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label
              htmlFor="settings-photo"
              className="block font-mono text-xs font-semibold uppercase tracking-wider text-subtext"
            >
              Avatar Image URL
            </label>
            <div className="relative mt-1.5">
              <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
              <input
                id="settings-photo"
                type="url"
                value={photo}
                onChange={(e) => setPhoto(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 pl-10 text-sm text-text outline-none transition-colors focus:border-main focus:ring-1 focus:ring-main/30"
              />
            </div>
            <p className="mt-1 text-[11px] text-subtext font-mono">
              Provide a direct link to any PNG/JPG image to customize your avatar.
            </p>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saving} className="gap-2 cursor-pointer">
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
          </div>
        </form>
      </div>

      {/* 2. Security & Password Reset */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div>
          <h3 className="text-lg font-bold text-text">Account Security</h3>
          <p className="mt-1 text-xs text-subtext">
            Manage your credentials and authentication methods.
          </p>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-border/80 bg-surface-2/40 p-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-text">
              <KeyRound className="h-4 w-4 text-main" />
              Change Password
            </div>
            <p className="mt-0.5 text-xs text-subtext">
              We'll send a secure password reset link to your registered email (<strong>{user?.email}</strong>).
            </p>
            {resetSent && (
              <p className="mt-1.5 font-mono text-xs text-correct">
                ✓ Password reset link sent! Check your inbox or spam folder.
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={sendingReset || resetSent}
            onClick={handleSendPasswordReset}
            className="cursor-pointer shrink-0"
          >
            {sendingReset ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </div>
      </div>

      {/* 3. Danger Zone */}
      <div className="rounded-2xl border border-error/30 bg-error/5 p-6 sm:p-8">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-error">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h3>
          <p className="mt-1 text-xs text-subtext">
            Irreversible actions regarding your account and typing history.
          </p>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-error/20 bg-surface/80 p-4 sm:flex-row sm:items-center">
          <div>
            <h4 className="font-mono text-xs font-bold text-text uppercase">
              Delete Account
            </h4>
            <p className="mt-0.5 text-xs text-subtext">
              Permanently remove your profile, personal bests, XP, and all test telemetry from MongoDB.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-error/15 px-4 py-2 font-mono text-xs font-semibold text-error transition-colors hover:bg-error hover:text-white shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-error/40 bg-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-error">
                <AlertTriangle className="h-5 w-5" />
                Confirm Account Deletion
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg p-1 text-subtext hover:bg-surface-2 hover:text-text cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-subtext leading-relaxed">
              This action <strong>CANNOT</strong> be undone. All your tests, speed records, level, and personal bests will be permanently erased.
            </p>

            <div>
              <label
                htmlFor="delete-confirm"
                className="block font-mono text-[11px] text-subtext mb-1"
              >
                To confirm, type <strong className="text-error">delete my account</strong> below:
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                className="w-full rounded-xl border border-border bg-surface-2/80 px-3.5 py-2 text-sm text-text outline-none focus:border-error"
              />
            </div>

            {deleteError && (
              <p className="font-mono text-xs text-error">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={deleting || deleteConfirmText.trim().toLowerCase() !== "delete my account"}
                onClick={handleDeleteAccount}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-error px-4 py-2 font-mono text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Everything
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
