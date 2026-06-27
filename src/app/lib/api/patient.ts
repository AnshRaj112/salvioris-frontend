import { getPatientToken } from "../auth/patient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class PatientApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function patientFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPatientToken();
  if (!token) throw new PatientApiError("Not authenticated");

  const res = await fetch(`${API_BASE_URL}/api/v1/patient/me${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new PatientApiError(text || `HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export interface WellnessEntry {
  id?: string;
  entry_date: string;
  metrics: {
    mood?: number;
    anxiety?: number;
    stress?: number;
    sleep_hours?: number;
    energy?: number;
    medication_adherence?: boolean;
  };
  reflection?: string;
}

export interface PatientTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  due_at?: string;
}

export interface PatientPrescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  status: string;
}

export interface PatientAppointment {
  id: string;
  type: string;
  status: string;
  starts_at: string;
  ends_at: string;
  meeting_link?: string;
}

export interface PatientInvoice {
  id: string;
  invoice_number: string;
  total: number;
  currency: string;
  status: string;
  due_at?: string;
}

export interface DMMessage {
  id: string;
  content: string;
  sender_role: string;
  read_at?: string | null;
  created_at: string;
}

export const patientApi = {
  logWellness: (body: { entry_date?: string; metrics: WellnessEntry["metrics"]; reflection?: string }) =>
    patientFetch<{ data: WellnessEntry }>("/wellness", { method: "POST", body: JSON.stringify(body) }),

  listWellness: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const s = q.toString() ? `?${q}` : "";
    return patientFetch<{ data: WellnessEntry[] }>(`/wellness${s}`);
  },

  listTasks: (status?: string) =>
    patientFetch<{ data: PatientTask[] }>(`/tasks${status ? `?status=${status}` : ""}`),

  completeTask: (taskId: string, patient_notes?: string) =>
    patientFetch<{ data: PatientTask }>(`/tasks/${taskId}/complete`, {
      method: "POST",
      body: JSON.stringify({ patient_notes }),
    }),

  listPrescriptions: (status = "active") =>
    patientFetch<{ data: PatientPrescription[] }>(`/prescriptions?status=${status}`),

  listAppointments: () => patientFetch<{ data: PatientAppointment[] }>("/appointments"),

  listMessages: () => patientFetch<{ data: DMMessage[] }>("/conversation/messages"),

  getConversation: () => patientFetch<{ data: { tenant_id: string; id: string } }>("/conversation"),

  sendMessage: (content: string) =>
    patientFetch<{ data: DMMessage }>("/conversation/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  markConversationRead: () =>
    patientFetch<void>("/conversation/read", { method: "PATCH" }),

  listInvoices: (status?: string) =>
    patientFetch<{ data: PatientInvoice[] }>(`/invoices${status ? `?status=${status}` : ""}`),

  payInvoice: (invoiceId: string) =>
    patientFetch<{ order_id: string; amount: number; currency: string; key_id: string; invoice_id: string }>(
      `/invoices/${invoiceId}/pay`,
      { method: "POST" }
    ),

  verifyPayment: (body: {
    invoice_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) =>
    patientFetch<{ success: boolean }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getTherapistAvailability: (therapistId: string, date?: string) => {
    const s = date ? `?date=${date}` : "";
    return patientFetch<{ data: Array<{ start: string; end: string }> }>(`/therapists/${therapistId}/availability${s}`);
  },

  initiateBooking: (body: {
    therapist_id: string;
    type: string;
    starts_at: string;
    notes?: string;
  }) =>
    patientFetch<{
      order_id: string;
      amount: number;
      currency: string;
      key_id: string;
      invoice_id: string;
      appointment_id: string;
    }>("/booking/initiate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyBookingPayment: (body: {
    invoice_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    appointment_id: string;
  }) =>
    patientFetch<{ success: boolean }>("/booking/verify", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listJournals: () => patientFetch<{ data: PatientJournal[] }>("/journals"),

  createJournal: (body: { title?: string; content: string; mood?: number }) =>
    patientFetch<{ data: PatientJournal }>("/journals", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export interface PatientJournal {
  id: string;
  title?: string;
  content: string;
  mood?: number;
  created_at: string;
}
