import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { Placeholder } from "@/components/placeholder";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Placeholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Your typing journey at a glance — speed curves, accuracy trends, weak keys and personal bests."
      features={["WPM over time", "Key heatmaps", "Personal bests", "Goals"]}
    />
  );
}
