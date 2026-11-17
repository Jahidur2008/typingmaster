"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Shield,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface MaintenanceContextType {
  isMaintenance: boolean;
  isAdmin: boolean;
  checkStatus: () => Promise<void>;
  setMaintenanceDirectly: (val: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenance: false,
  isAdmin: false,
  checkStatus: async () => {},
  setMaintenanceDirectly: () => {},
});

export function useMaintenance() {
  return useContext(MaintenanceContext);
}

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mongoUser } = useAuth();

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isAdminTokenPresent, setIsAdminTokenPresent] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Check admin authorization from localStorage or mongoUser role
  const checkAdminToken = useCallback(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("typing_master_admin_token");
    const hasToken = Boolean(token);
    setIsAdminTokenPresent(hasToken);
    return hasToken;
  }, []);

  const isAdmin = isAdminTokenPresent || mongoUser?.role === "admin";

  // Fetch /api/settings to check maintenanceMode
  const checkStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      checkAdminToken();
      const res = await fetch(`${API_URL}/api/settings`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setIsMaintenance(Boolean(data.maintenanceMode));
      }
    } catch {
      // Non-fatal if offline
    } finally {
      setIsChecking(false);
    }
  }, [checkAdminToken]);

  useEffect(() => {
    checkAdminToken();
    void checkStatus();

    // Re-check periodically (every 15s) and on tab focus
    const interval = setInterval(checkStatus, 15000);
    const onFocus = () => void checkStatus();
    window.addEventListener("focus", onFocus);

    // Custom event to sync instantly across components
    const onMaintenanceUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ maintenanceMode: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.maintenanceMode === "boolean") {
        setIsMaintenance(customEvent.detail.maintenanceMode);
      } else {
        void checkStatus();
      }
    };
    window.addEventListener("tm:maintenance_updated", onMaintenanceUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("tm:maintenance_updated", onMaintenanceUpdated);
    };
  }, [checkStatus, checkAdminToken]);

  const setMaintenanceDirectly = (val: boolean) => {
    setIsMaintenance(val);
  };

  // If path is inside /admin, never block the screen!
  const isAdminRoute = pathname?.startsWith("/admin");

  // Case 1: Under maintenance AND user is NOT an admin AND not on /admin route -> Show Maintenance Screen
  if (isMaintenance && !isAdmin && !isAdminRoute) {
    return (
      <div className="relative min-h-screen bg-bg text-text flex flex-col justify-between overflow-hidden select-none">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-main blur-[160px]" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-error blur-[180px]" />
        </div>

        {/* Header branding */}
        <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center font-mono font-bold text-main shadow-inner">
              TM
            </div>
            <span className="font-bold tracking-tight text-lg text-text">Typing Master</span>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-mono text-subtext hover:text-main transition-colors px-3 py-1.5 rounded-lg border border-border bg-surface/50 backdrop-blur-sm"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Admin Portal</span>
          </Link>
        </header>

        {/* Center Maintenance Hero */}
        <main className="relative z-10 w-full max-w-2xl mx-auto px-6 py-12 text-center flex flex-col items-center">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>সিস্টেম রক্ষণাবেক্ষণ চলছে • Maintenance in Progress</span>
          </div>

          {/* Animated illustration / icon container */}
          <div className="relative mb-8">
            <div className="h-28 w-28 rounded-3xl bg-surface border border-border flex items-center justify-center shadow-2xl relative z-10">
              <Wrench className="h-14 w-14 text-main animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-main/20 blur-xl -z-0"></div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text mb-4">
            Under Scheduled Maintenance
          </h1>

          <p className="text-subtext text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
            Typing Master is undergoing planned upgrades to enhance server performance, competition matchmaking, and system security.
            Public tests and drills are temporarily paused.
          </p>

          {/* Status box */}
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface/70 backdrop-blur-md p-5 mb-8 text-left space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-subtext font-mono">Current Status:</span>
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Core Upgrades Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-subtext font-mono">User Data & Records:</span>
              <span className="font-semibold text-correct flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Safe & Synced
              </span>
            </div>
            <div className="pt-2 border-t border-border/60 text-[11px] text-subtext leading-relaxed">
              We are working to bring everything back online shortly. Thank you for your patience!
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => void checkStatus()}
              variant="primary"
              className="gap-2 cursor-pointer shadow-lg"
              disabled={isChecking}
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Checking Status..." : "Check Again / Refresh"}</span>
            </Button>

            <Link href="/admin">
              <Button variant="ghost" className="gap-2 text-subtext hover:text-text cursor-pointer">
                <Shield className="h-4 w-4" />
                <span>Admin Login</span>
              </Button>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-subtext/70 font-mono">
          © {new Date().getFullYear()} Typing Master — All rights reserved.
        </footer>
      </div>
    );
  }

  // Case 2: Under maintenance AND user IS an admin -> Allow access, show prominent banner!
  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenance,
        isAdmin,
        checkStatus,
        setMaintenanceDirectly,
      }}
    >
      {isMaintenance && isAdmin && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-xs font-mono sticky top-0 z-50 backdrop-blur-md flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-medium">
              <strong className="text-amber-200">MAINTENANCE MODE IS ACTIVE:</strong> Public visitors are currently blocked from the site. You are viewing with Administrator privileges.
            </span>
          </div>
        </div>
      )}
      {children}
    </MaintenanceContext.Provider>
  );
}
