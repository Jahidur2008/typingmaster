"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Flame,
  History,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Test" },
  { href: "/practice", label: "Practice" },
  { href: "/learn", label: "Learn" },
  { href: "/challenge", label: "Challenge" },
  { href: "/competition", label: "Competition" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, mongoUser, logout, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setOpen(false);
    await logout();
    router.push("/");
  };

  const displayName =
    mongoUser?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const avatarUrl = mongoUser?.photo || user?.photoURL;
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(pathname, link.href)
                      ? "text-main"
                      : "text-subtext hover:text-text",
                  )}
                >
                  {link.label}
                  {isActive(pathname, link.href) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-main"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:flex" />

          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(
              "hidden h-9 w-9 items-center justify-center rounded-md transition-colors sm:flex",
              isActive(pathname, "/settings")
                ? "text-main"
                : "text-subtext hover:bg-surface-2 hover:text-text",
            )}
          >
            <Settings className="h-4.5 w-4.5" />
          </Link>

          {loading ? (
            /* Subtle skeleton when auth is initializing */
            <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />
          ) : user ? (
            /* Logged in: Streak + Avatar + Dropdown */
            <div className="flex items-center gap-2.5">
              {mongoUser?.streak?.current ? (
                <div
                  title={`Current Streak: ${mongoUser.streak.current} day(s)`}
                  className="hidden sm:flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-orange-400 shadow-sm"
                >
                  <Flame className="h-3.5 w-3.5 fill-orange-400 text-orange-500" />
                  <span>{mongoUser.streak.current}d</span>
                </div>
              ) : null}

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border p-0.5 transition-all hover:border-main/50 focus:outline-none focus:ring-2 focus:ring-main/20"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-8 w-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-main/20 font-mono text-xs font-bold text-main">
                      {initial}
                    </div>
                  )}
                  <ChevronDown className="hidden h-3.5 w-3.5 text-subtext transition-transform duration-200 sm:block" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      key="desktop-dropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-border bg-surface p-2 shadow-2xl backdrop-blur-xl"
                    >
                      {/* User header */}
                      <div className="border-b border-border px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-text">
                          {displayName}
                        </p>
                        <p className="truncate font-mono text-xs text-subtext">
                          {user.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-main/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-main">
                            Lv. {mongoUser?.level || 1}
                          </span>
                          <span className="font-mono text-[11px] text-subtext">
                            {mongoUser?.xp || 0} XP
                          </span>
                          {mongoUser?.streak?.current ? (
                            <span className="flex items-center gap-1 rounded bg-orange-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-400">
                              <Flame className="h-3 w-3" />
                              {mongoUser.streak.current}d streak
                            </span>
                          ) : null}
                        </div>
                      </div>

                    {/* Nav links */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-surface-2 hover:text-text",
                          isActive(pathname, "/profile") && "bg-surface-2 text-main",
                        )}
                      >
                        <UserRound className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        href="/history"
                        onClick={() => setDropdownOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-surface-2 hover:text-text",
                          isActive(pathname, "/history") && "bg-surface-2 text-main",
                        )}
                      >
                        <History className="h-4 w-4" />
                        <span>History</span>
                      </Link>

                      {mongoUser?.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-surface-2 hover:text-text",
                            isActive(pathname, "/admin") && "bg-surface-2 text-main",
                          )}
                        >
                          <Shield className="h-4 w-4 text-main" />
                          <span className="font-semibold text-main">Admin Panel</span>
                        </Link>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-border pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-error/90 transition-colors hover:bg-error/10 hover:text-error"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          ) : (
            /* Logged out: Sign in button */
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex h-9 items-center gap-2 rounded-md bg-surface-2 px-3.5 text-sm font-medium text-text transition-colors hover:bg-main hover:text-bg"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-text transition-colors hover:bg-surface-2 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-border bg-bg lg:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04 } },
                hidden: {},
              }}
              className="flex flex-col gap-1 px-4 py-4"
            >
              {/* If user logged in on mobile, show user card */}
              {user && (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-main/20 font-mono text-sm font-bold text-main">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {displayName}
                    </p>
                    <p className="truncate font-mono text-xs text-subtext">
                      Lv. {mongoUser?.level || 1} • {mongoUser?.xp || 0} XP
                    </p>
                  </div>
                </div>
              )}

              {links.map((link) => (
                <motion.li
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(pathname, link.href)
                        ? "bg-surface text-main"
                        : "text-subtext hover:bg-surface hover:text-text",
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}

              {user ? (
                <>
                  <div className="my-1 border-t border-border" />
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-subtext hover:text-text"
                  >
                    <UserRound className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-subtext hover:text-text"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Link>
                  {mongoUser?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-main font-semibold hover:bg-main/10"
                    >
                      <Shield className="h-4 w-4 text-main" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-error/90 hover:bg-error/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="mt-2 border-t border-border pt-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-main px-3 py-2 text-sm font-medium text-bg"
                  >
                    <LogIn className="h-4 w-4" />
                    Login / Sign up
                  </Link>
                </div>
              )}

              <motion.li
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="mt-2 flex items-center justify-between border-t border-border pt-3"
              >
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-subtext hover:text-text"
                >
                  <Settings className="h-4.5 w-4.5" />
                  Settings
                </Link>
                <ThemeToggle />
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
