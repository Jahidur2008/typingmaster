"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Smooth page transitions: every route change re-keys the motion container,
 * so pages fade/slide in on navigation. (Enter-only by design — exit
 * animations conflict with the App Router's streaming model.)
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex flex-1 flex-col"
    >
      {children}
    </motion.main>
  );
}
