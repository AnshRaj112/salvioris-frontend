"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const UNLOCK_KEY = "site_unlocked";

export function SiteLock({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Use useLayoutEffect to run synchronously before paint
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const unlocked = localStorage.getItem(UNLOCK_KEY) === "true";
      
      // If locked and not on home page or admin page, redirect immediately
      if (!unlocked && pathname !== "/" && !pathname.startsWith("/admin")) {
        window.location.replace("/");
      }
    }
  }, [pathname]);

  // Check synchronously to prevent render if redirecting
  if (typeof window !== "undefined") {
    const unlocked = localStorage.getItem(UNLOCK_KEY) === "true";
    if (!unlocked && pathname !== "/" && !pathname.startsWith("/admin")) {
      // Return null to prevent rendering while redirect happens
      return null;
    }
  }

  return <>{children}</>;
}

