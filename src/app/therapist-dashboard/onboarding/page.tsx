"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail, Trash2 } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { AlertMessages } from "../Alerts";
import { OnboardedPatient } from "../types";
import styles from "../TherapistDashboard.module.scss";

export default function OnboardingPage() {
  const [patients, setPatients] = useState<OnboardedPatient[]>([]);
  const [form, setForm] = useState({ patient_name: "", patient_email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await api.getOnboardedPatients();
    if (res.success) setPatients(res.patients || []);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.onboardPatient({ patient_name: form.patient_name.trim(), patient_email: form.patient_email.trim() });
      if (res.success) {
        setSuccessMsg(`Patient onboarded. Credentials emailed to ${form.patient_email}.`);
        setForm({ patient_name: "", patient_email: "" });
        load();
      }
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to onboard.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (p: OnboardedPatient) => {
    const msg = p.status === "activated"
      ? `Remove ${p.patient_name} from your onboarding list? Their account stays active.`
      : `Remove ${p.patient_name}? Their pending account will be deactivated.`;
    if (!confirm(msg)) return;
    try {
      await api.removeOnboardedPatient(p.id);
      setPatients((prev) => prev.filter((x) => x.id !== p.id));
      setSuccessMsg(`${p.patient_name} removed from onboarding list.`);
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to remove.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AlertMessages error={errorMsg} success={successMsg} />
      <div className={styles.onboardingContainer}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Onboard Current Patients</h2>
            <p className={styles.sectionSubtitle}>Create accounts and email login credentials to patients.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.onboardingForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patient Name</label>
            <input type="text" required placeholder="e.g. Ansh Raj" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className={styles.formInput} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patient Email</label>
            <input type="email" required placeholder="patient@email.com" value={form.patient_email} onChange={(e) => setForm({ ...form, patient_email: e.target.value })} className={styles.formInput} />
          </div>
          <button type="submit" disabled={submitting} className={styles.primaryButton}>
            <UserPlus className="h-4 w-4" />{submitting ? "Onboarding..." : "Onboard Patient"}
          </button>
        </form>

        {patients.length > 0 && (
          <div className={styles.onboardingList}>
            <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "#6B4C93" }}>
              <Mail className="h-4 w-4" /> Onboarded Patients ({patients.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {patients.map((p) => (
                <div key={p.id} className={styles.onboardingCard}>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "#3b2055" }}>{p.patient_name}</h4>
                    <p className="text-[10px] text-slate-500">{p.patient_email}</p>
                    <p className="text-[10px] text-slate-500">Username: <strong>{p.username}</strong> · Referral: <strong>{p.referral_code}</strong></p>
                    <p className="text-[10px] text-slate-400">Onboarded {new Date(p.onboarded_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${styles.rosterTypeBadge} ${p.status === "activated" ? styles.referral : styles.onboarded}`}>{p.status}</span>
                    <button onClick={() => handleRemove(p)} className={styles.rejectButton} title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
