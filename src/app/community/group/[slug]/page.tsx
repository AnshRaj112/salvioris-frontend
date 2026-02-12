"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CommunityPage from "../../page";

export default function GroupBySlugPage() {
  // This route simply reuses the main community UI and relies on the
  // /community page logic to handle active group selection and join state.
  // Deep-link behavior (redirect to login if not authenticated) should be
  // implemented via auth guard higher up in the app if required.
  const router = useRouter();

  useEffect(() => {
    // If no session, redirect to signin; otherwise allow.
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("session_token");
    if (!token) {
      router.replace("/signin");
    }
  }, [router]);

  return <CommunityPage />;
}


