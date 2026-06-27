const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds (604800)

export function getPatientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("session_token");
}

export function getPatientUser(): { id: string; username: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Returns true if the session has passed its expiry timestamp */
export function isPatientSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const expiry = localStorage.getItem("patient_session_expiry");
  if (!expiry) return false; // Legacy sessions (no expiry set) — let them through
  return Date.now() > parseInt(expiry, 10);
}

/** Renews the session for another 7 days from now — call on every page visit */
export function renewPatientSession(): void {
  if (typeof window === "undefined") return;
  const newExpiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem("patient_session_expiry", String(newExpiry));
  // Renew the cookie sliding window too
  document.cookie = `patient_session=1; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
}

function setPatientCookie() {
  document.cookie = `patient_session=1; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
}

function clearPatientCookie() {
  document.cookie = "patient_session=; path=/; max-age=0; SameSite=Lax";
}

export function storePatientAuth(user: { id: string; username: string }, token: string) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("session_token", token);
  localStorage.setItem("patient_session_expiry", String(Date.now() + SESSION_DURATION_MS));
  setPatientCookie();
}

export function clearPatientAuth() {
  localStorage.removeItem("user");
  localStorage.removeItem("session_token");
  localStorage.removeItem("token");
  localStorage.removeItem("patient_session_expiry");
  clearPatientCookie();
}
