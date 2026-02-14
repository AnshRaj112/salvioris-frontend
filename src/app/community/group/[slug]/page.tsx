"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CommunityPage from "../../page";

export default function GroupBySlugPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = window.localStorage.getItem("session_token");
    if (!token) {
      router.replace("/signin");
    }
  }, [mounted, router]);

  // Render same minimal shell on server and first client render to avoid hydration mismatch,
  // then show full CommunityPage after mount (client-only code has run).
  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return <CommunityPage />;
}


