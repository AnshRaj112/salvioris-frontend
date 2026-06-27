import { getReceptionistAuthToken, getReceptionistTenantId } from "../auth/receptionist";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function headers(): HeadersInit {
  const token = getReceptionistAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function tenantBase(): string {
  const tenantId = getReceptionistTenantId();
  return `${API_BASE}/api/v1/reception/${tenantId}`;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export const receptionApi = {
  signin: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/receptionist/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  signout: async () => {
    const res = await fetch(`${API_BASE}/api/auth/receptionist/signout`, {
      method: "POST",
      headers: headers(),
    });
    return res.json();
  },

  // ─── Appointments ──────────────────────────────────────────────────────────

  listAppointments: async (params?: { from?: string; to?: string; status?: string }) => {
    const url = new URL(`${tenantBase()}/appointments`);
    if (params?.from) url.searchParams.set("from", params.from);
    if (params?.to) url.searchParams.set("to", params.to);
    if (params?.status) url.searchParams.set("status", params.status);
    const res = await fetch(url.toString(), { headers: headers() });
    return res.json();
  },

  walkIn: async (data: {
    patient_name: string;
    phone?: string;
    email?: string;
    therapist_id?: string;
    starts_at: string;
    duration_min?: number;
    location?: string;
    notes?: string;
  }) => {
    const res = await fetch(`${tenantBase()}/appointments/walk-in`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  quickRegister: async (data: { patient_name: string; phone?: string; email?: string }) => {
    const res = await fetch(`${tenantBase()}/appointments/quick-register`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ─── Patients ──────────────────────────────────────────────────────────────

  listPatients: async () => {
    const res = await fetch(`${tenantBase()}/patients`, { headers: headers() });
    return res.json();
  },

  // ─── Billing ───────────────────────────────────────────────────────────────

  listInvoices: async (params?: { status?: string; patient_id?: string }) => {
    const url = new URL(`${tenantBase()}/invoices`);
    if (params?.status) url.searchParams.set("status", params.status);
    if (params?.patient_id) url.searchParams.set("patient_id", params.patient_id);
    const res = await fetch(url.toString(), { headers: headers() });
    return res.json();
  },

  collectPayment: async (data: { invoice_id: string; provider: string; amount: number }) => {
    const res = await fetch(`${tenantBase()}/invoices/collect-payment`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ─── Referrals ─────────────────────────────────────────────────────────────

  listReferralCodes: async () => {
    const res = await fetch(`${tenantBase()}/referral-codes`, { headers: headers() });
    return res.json();
  },
};

// ─── Therapist-side staff management (uses therapist JWT) ──────────────────

export async function therapistStaffApi(tenantId: string, accessToken: string) {
  const base = `${API_BASE}/api/v1/tenant/${tenantId}`;
  const h: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  return {
    listReceptionists: async () => {
      const res = await fetch(`${base}/receptionists`, { headers: h });
      return res.json();
    },
    createReceptionist: async (data: { name: string; email: string; password: string }) => {
      const res = await fetch(`${base}/receptionists`, {
        method: "POST",
        headers: h,
        body: JSON.stringify(data),
      });
      return res.json();
    },
    deactivateReceptionist: async (receptionistId: string) => {
      const res = await fetch(`${base}/receptionists/${receptionistId}`, {
        method: "DELETE",
        headers: h,
      });
      return res.json();
    },
    reactivateReceptionist: async (receptionistId: string) => {
      const res = await fetch(`${base}/receptionists/${receptionistId}/reactivate`, {
        method: "PATCH",
        headers: h,
      });
      return res.json();
    },
  };
}
