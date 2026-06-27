const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export function getReceptionistTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("receptionist_tenant_id");
}

export function getReceptionistAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("receptionist_access_token");
}

export function isReceptionistSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const expiry = localStorage.getItem("receptionist_session_expiry");
  if (!expiry) return false;
  return Date.now() > parseInt(expiry, 10);
}

export function renewReceptionistSession(): void {
  if (typeof window === "undefined") return;
  const newExpiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem("receptionist_session_expiry", String(newExpiry));
  document.cookie = `receptionist_session=1; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
}

export function storeReceptionistAuth(
  receptionist: Record<string, unknown>,
  accessToken: string,
  refreshToken?: string
) {
  localStorage.setItem("receptionist", JSON.stringify(receptionist));
  localStorage.setItem("receptionist_access_token", accessToken);
  if (refreshToken) localStorage.setItem("receptionist_refresh_token", refreshToken);
  const tenantId = receptionist.tenant_id as string | undefined;
  if (tenantId) localStorage.setItem("receptionist_tenant_id", tenantId);
  localStorage.setItem("receptionist_session_expiry", String(Date.now() + SESSION_DURATION_MS));
  document.cookie = `receptionist_session=1; path=/; max-age=${SESSION_DURATION_SECONDS}; SameSite=Lax`;
}

export function clearReceptionistAuth() {
  localStorage.removeItem("receptionist");
  localStorage.removeItem("receptionist_access_token");
  localStorage.removeItem("receptionist_refresh_token");
  localStorage.removeItem("receptionist_tenant_id");
  localStorage.removeItem("receptionist_session_expiry");
  document.cookie = `receptionist_session=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredReceptionist(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("receptionist");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
