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

function setPatientCookie() {
  document.cookie = "patient_session=1; path=/; max-age=604800; SameSite=Lax";
}

function clearPatientCookie() {
  document.cookie = "patient_session=; path=/; max-age=0; SameSite=Lax";
}

export function storePatientAuth(user: { id: string; username: string }, token: string) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("session_token", token);
  setPatientCookie();
}

export function clearPatientAuth() {
  localStorage.removeItem("user");
  localStorage.removeItem("session_token");
  localStorage.removeItem("token");
  clearPatientCookie();
}
