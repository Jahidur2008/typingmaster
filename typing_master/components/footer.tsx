import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Typing Test" },
      { href: "/practice", label: "Practice" },
      { href: "/learn", label: "Learn" },
      { href: "/challenge", label: "Challenge" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/competition", label: "Competition" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/profile", label: "Profile" },
      { href: "/history", label: "History" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/settings", label: "Settings" },
      { href: "/admin", label: "Admin" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-subtext">
              A minimal, distraction-free typing tutor. Measure, practice and
              master — one keystroke at a time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-mono text-xs font-semibold tracking-widest text-subtext uppercase">
                  {col.title}
                </h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-subtext transition-colors hover:text-main"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="font-mono text-xs text-subtext">
            © 2026 Typing Master
          </p>
          <p className="font-mono text-xs text-subtext">
            built for typists, by typists
          </p>
        </div>
      </div>
    </footer>
  );
}
