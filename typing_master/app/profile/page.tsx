"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  BarChart2,
  History as HistoryIcon,
  Settings,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AmbientBackground } from "@/components/ambient-background";
import { API_URL } from "@/lib/api-config";

import { ProfileHeader } from "@/components/profile/header";
import { OverviewTab, type SummaryStats } from "@/components/profile/overview-tab";
import { ProgressTab } from "@/components/profile/progress-tab";
import { PersonalBestsTab } from "@/components/profile/personal-bests-tab";
import { HistoryTab } from "@/components/profile/history-tab";
import { BadgesTab } from "@/components/profile/badges-tab";
import { SettingsTab } from "@/components/profile/settings-tab";

type TabKey = "overview" | "progress" | "pbs" | "history" | "badges" | "settings";

const TABS: Array<{ key: TabKey; label: string; icon: typeof Activity }> = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "progress", label: "Progress", icon: BarChart2 },
  { key: "pbs", label: "Personal Bests", icon: Trophy },
  { key: "history", label: "History", icon: HistoryIcon },
  { key: "badges", label: "Badges", icon: Award },
  { key: "settings", label: "Settings", icon: Settings },
];

function ProfileDashboard() {
  const { user, mongoUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Summary stats & heatmap
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<
    Array<{ date: string; count: number; avgWpm: number; avgAccuracy: number }>
  >([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch overview summary & heatmap
  useEffect(() => {
    if (!token) return;
    let isCurrent = true;
    setStatsLoading(true);

    Promise.all([
      fetch(`${API_URL}/api/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/api/stats/heatmap`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([summaryRes, heatmapRes]) => {
        if (!isCurrent) return;
        if (summaryRes) setStats(summaryRes);
        if (heatmapRes) setHeatmapData(heatmapRes);
      })
      .catch((err) => console.warn("[profile] Summary fetch error:", err))
      .finally(() => {
        if (isCurrent) setStatsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <AmbientBackground />

      <div className="relative w-full max-w-5xl space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          mongoUser={mongoUser}
          onEditProfile={() => setActiveTab("settings")}
        />

        {/* Tab Navigation (Horizontally scrollable on mobile) */}
        <div className="flex border-b border-border overflow-x-auto no-scrollbar pb-px">
          <div className="flex gap-2 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 font-mono text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "border-main text-main bg-main/5"
                      : "border-transparent text-subtext hover:border-border hover:text-text"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-main" : "text-subtext"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="pt-2">
          {activeTab === "overview" && (
            <OverviewTab
              stats={stats}
              heatmapData={heatmapData}
              loading={statsLoading}
            />
          )}

          {activeTab === "progress" && <ProgressTab token={token} />}

          {activeTab === "pbs" && <PersonalBestsTab token={token} />}

          {activeTab === "history" && <HistoryTab token={token} />}

          {activeTab === "badges" && <BadgesTab token={token} />}

          {activeTab === "settings" && (
            <SettingsTab
              key={`${mongoUser?._id || user?.uid}-${mongoUser?.name || ""}-${mongoUser?.country || ""}-${mongoUser?.photo || ""}`}
              initialName={mongoUser?.name || user?.displayName || ""}
              initialCountry={mongoUser?.country || ""}
              initialPhoto={mongoUser?.photo || user?.photoURL || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute fallbackMessage="Loading user dashboard...">
      <ProfileDashboard />
    </ProtectedRoute>
  );
}
