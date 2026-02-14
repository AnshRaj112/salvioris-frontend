"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";

/**
 * Tracks page views for admin analytics. Records path when route changes.
 * Skips admin routes. Non-blocking.
 */
export function ActivityTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/admin-login")) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    api.recordActivity(pathname).catch(() => {});
  }, [pathname]);

  return null;
}
