const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds (604800)

export function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tenant_id");
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || localStorage.getItem("session_token");
}

/** Returns true if the therapist session has passed its expiry timestamp */
export function isTherapistSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const expiry = localStorage.getItem("therapist_session_expiry");
  if (!expiry) return false; // Legacy sessions (no expiry set) — let them through
  return Date.now() > parseInt(expiry, 10);
}

/** Renews the therapist session for another 7 days from now — call on every page visit */
export function renewTherapistSession(): void {
  if (typeof window === "undefined") return;
  const newExpiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem("therapist_session_expiry", String(newExpiry));
  // Renew the cookie sliding window too
  document.cookie = `therapist_session=1; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
}

function setAuthCookie(name: string, value: string) {
  document.cookie = `${name}=1; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
  void value;
}

function clearAuthCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function storeTherapistAuth(user: Record<string, unknown>, token?: string, accessToken?: string, refreshToken?: string) {
  localStorage.setItem("therapist", JSON.stringify(user));
  if (token) localStorage.setItem("session_token", token);
  if (accessToken) localStorage.setItem("access_token", accessToken);
  if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  const tenantId = user.tenant_id as string | undefined;
  if (tenantId) localStorage.setItem("tenant_id", tenantId);
  localStorage.setItem("therapist_session_expiry", String(Date.now() + SESSION_DURATION_MS));
  setAuthCookie("therapist_session", accessToken || token || "1");
}

export function clearTherapistAuth() {
  localStorage.removeItem("therapist");
  localStorage.removeItem("session_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("therapist_session_expiry");
  clearAuthCookie("therapist_session");
}
