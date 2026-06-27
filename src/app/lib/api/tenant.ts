import { getAuthToken, getTenantId } from "../../lib/auth/tenant";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class TenantApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function tenantFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tenantId = getTenantId();
  const token = getAuthToken();
  if (!tenantId) throw new TenantApiError("No tenant ID — sign in again");
  if (!token) throw new TenantApiError("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/v1/tenant/${tenantId}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new TenantApiError(text || `HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export interface V2Patient {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
}

export interface V2SessionNote {
  id: string;
  session_number: number;
  status: string;
  plain_text?: string;
  session_date: string;
  progress_rating?: number;
}

export interface V2Appointment {
  id: string;
  patient_id: string;
  type: string;
  status: string;
  starts_at: string;
  ends_at: string;
  location?: string;
  meeting_link?: string;
}

export interface V2AvailabilitySlot {
  id: string;
  tenant_id: string;
  therapist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  is_active: boolean;
}

export interface AnalyticsOverview {
  active_patients: number;
  sessions_completed_month: number;
  appointments_upcoming_week: number;
  revenue_month: number;
  currency: string;
}

export const tenantApi = {
  listPatients: () =>
    tenantFetch<{ data: V2Patient[] }>("/patients"),

  createPatient: (body: { full_name: string; email?: string; phone?: string }) =>
    tenantFetch<{ data: V2Patient }>("/patients", { method: "POST", body: JSON.stringify(body) }),

  getPatient: (id: string) =>
    tenantFetch<{ data: V2Patient }>(`/patients/${id}`),

  listNotes: (patientId: string) =>
    tenantFetch<{ data: V2SessionNote[] }>(`/patients/${patientId}/notes`),

  createNote: (patientId: string, body: { plain_text: string; progress_rating?: number }) =>
    tenantFetch<{ data: V2SessionNote }>(`/patients/${patientId}/notes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  publishNote: (patientId: string, noteId: string) =>
    tenantFetch<{ data: V2SessionNote }>(`/patients/${patientId}/notes/${noteId}/publish`, {
      method: "POST",
    }),

  listAppointments: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const suffix = q.toString() ? `?${q}` : "";
    return tenantFetch<{ data: V2Appointment[] }>(`/appointments${suffix}`);
  },

  createAppointment: (body: {
    patient_id: string;
    type: string;
    starts_at: string;
    duration_min?: number;
  }) =>
    tenantFetch<{ data: V2Appointment }>("/appointments", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  analyticsOverview: () =>
    tenantFetch<{ data: AnalyticsOverview }>("/analytics/overview"),

  riskAlerts: () =>
    tenantFetch<{ data: Array<{ patient_id: string; patient_name: string; risk_indicators: string[] }>; disclaimer: string }>(
      "/ai/risk-alerts"
    ),

  patientProgress: (patientId: string) =>
    tenantFetch<{ data: { summary: string; insights: string[]; disclaimer: string } }>(
      `/patients/${patientId}/ai/progress`
    ),

  updateAppointment: (id: string, body: { status?: string }) =>
    tenantFetch<{ data: V2Appointment }>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  calendarStatus: () =>
    tenantFetch<{ configured: boolean; connected: boolean }>("/calendar/status"),

  connectGoogleCalendar: () =>
    tenantFetch<{ auth_url: string }>("/calendar/connect/google"),

  disconnectGoogleCalendar: () =>
    tenantFetch<{ success: boolean }>("/calendar/disconnect", { method: "DELETE" }),

  receptionWalkIn: (body: {
    patient_name: string;
    phone?: string;
    email?: string;
    starts_at: string;
    duration_min?: number;
    location?: string;
  }) =>
    tenantFetch<{ data: { patient_id: string; appointment_id: string } }>("/reception/walk-in", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  receptionQuickRegister: (body: { patient_name: string; phone?: string; email?: string }) =>
    tenantFetch<{ data: V2Patient }>("/reception/quick-register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  receptionCollectPayment: (body: { invoice_id: string; provider: string; amount?: number }) =>
    tenantFetch<{ data: TenantInvoice }>("/reception/collect-payment", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listConversations: () =>
    tenantFetch<{ data: DMConversation[] }>("/conversations"),

  getPatientConversation: (patientId: string) =>
    tenantFetch<{ data: DMConversation }>(`/patients/${patientId}/conversation`),

  listConversationMessages: (conversationId: string) =>
    tenantFetch<{ data: DMMessage[] }>(`/conversations/${conversationId}/messages`),

  sendConversationMessage: (conversationId: string, content: string) =>
    tenantFetch<{ data: DMMessage }>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  markConversationRead: (conversationId: string) =>
    tenantFetch<void>(`/conversations/${conversationId}/read`, { method: "PATCH" }),

  getBillingProfile: () =>
    tenantFetch<{ data: BillingProfile }>("/billing/profile"),

  updateBillingProfile: (body: Partial<BillingProfile>) =>
    tenantFetch<{ data: BillingProfile }>("/billing/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listInvoices: (status?: string) =>
    tenantFetch<{ data: TenantInvoice[] }>(`/invoices${status ? `?status=${status}` : ""}`),

  createInvoice: (body: {
    patient_id: string;
    appointment_id?: string;
    line_items?: Array<{ description: string; amount: number }>;
    notes?: string;
    due_at?: string;
  }) =>
    tenantFetch<{ data: TenantInvoice }>("/invoices", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  sendInvoice: (invoiceId: string) =>
    tenantFetch<{ data: TenantInvoice }>(`/invoices/${invoiceId}/send`, { method: "POST" }),

  listPrescriptions: (patientId: string, status = "active") =>
    tenantFetch<{ data: TenantPrescription[] }>(`/patients/${patientId}/prescriptions?status=${status}`),

  createPrescription: (
    patientId: string,
    body: { medicine_name: string; dosage: string; frequency: string; duration_days?: number; notes?: string }
  ) =>
    tenantFetch<{ data: TenantPrescription }>(`/patients/${patientId}/prescriptions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listPatientTasks: (patientId: string, status?: string) =>
    tenantFetch<{ data: TenantTask[] }>(`/patients/${patientId}/tasks${status ? `?status=${status}` : ""}`),

  createTask: (
    patientId: string,
    body: { title: string; description?: string; category?: string; due_at?: string }
  ) =>
    tenantFetch<{ data: TenantTask }>(`/patients/${patientId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listPatientWellness: (patientId: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const s = q.toString() ? `?${q}` : "";
    return tenantFetch<{ data: WellnessEntry[] }>(`/patients/${patientId}/wellness${s}`);
  },

  listAvailability: () =>
    tenantFetch<{ data: V2AvailabilitySlot[] }>("/availability"),

  createAvailability: (body: { day_of_week: number; start_time: string; end_time: string; slot_duration_min?: number }) =>
    tenantFetch<{ data: V2AvailabilitySlot }>("/availability", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteAvailability: (slotId: string) =>
    tenantFetch<void>(`/availability/${slotId}`, {
      method: "DELETE",
    }),
};

export interface BillingProfile {
  consultation_fee: number;
  session_fee: number;
  gst_rate: number;
  invoice_prefix: string;
  currency: string;
  gst_number?: string;
  session_fee_in_person: number;
  session_fee_chat: number;
  session_fee_voice: number;
  session_fee_video: number;
}

export interface TenantInvoice {
  id: string;
  patient_id: string;
  invoice_number: string;
  total: number;
  currency: string;
  status: string;
  due_at?: string;
}

export interface TenantPrescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  status: string;
}

export interface TenantTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_at?: string;
}

export interface WellnessEntry {
  entry_date: string;
  metrics: Record<string, number | boolean>;
  reflection?: string;
}

export interface DMConversation {
  id: string;
  patient_id: string;
  patient_name?: string;
  last_message_preview?: string;
  unread_count_therapist?: number;
}

export interface DMMessage {
  id: string;
  content: string;
  sender_role: string;
  read_at?: string | null;
  created_at: string;
}
