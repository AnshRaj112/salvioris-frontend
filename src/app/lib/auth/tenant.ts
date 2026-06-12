export function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tenant_id");
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token") || localStorage.getItem("session_token");
}

function setAuthCookie(name: string, value: string) {
  document.cookie = `${name}=1; path=/; max-age=${7 * 86400}; SameSite=Lax`;
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
  setAuthCookie("therapist_session", accessToken || token || "1");
}

export function clearTherapistAuth() {
  localStorage.removeItem("therapist");
  localStorage.removeItem("session_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant_id");
  clearAuthCookie("therapist_session");
}
