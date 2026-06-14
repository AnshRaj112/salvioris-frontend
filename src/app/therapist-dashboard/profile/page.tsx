"use client";

import { useEffect, useState } from "react";
import { Edit3, Save } from "lucide-react";
import { api, ApiError, Therapist } from "../../lib/api";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function ProfilePage() {
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ 
    specialization: "", 
    phone: "", 
    years_of_experience: 0, 
    dsm_awareness: "", 
    therapy_types: "",
    session_fee_chat: 0,
    session_fee_in_person: 0
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const res = await api.getTherapistMe();
        if (res.success && res.user) {
          const t = res.user as Therapist;
          localStorage.setItem("therapist", JSON.stringify(t));
          setTherapist(t);
          setForm({
            specialization: t.specialization || "",
            phone: t.phone || "",
            years_of_experience: t.years_of_experience || 0,
            dsm_awareness: t.dsm_awareness || "",
            therapy_types: t.therapy_types || "",
            session_fee_chat: t.session_fee_chat || 0,
            session_fee_in_person: t.session_fee_in_person || 0,
          });
          return;
        }
      } catch (err) {
        console.error("Failed to load fresh profile data:", err);
      }

      const stored = localStorage.getItem("therapist");
      if (stored) {
        const t = JSON.parse(stored) as Therapist;
        setTherapist(t);
        setForm({
          specialization: t.specialization || "",
          phone: t.phone || "",
          years_of_experience: t.years_of_experience || 0,
          dsm_awareness: t.dsm_awareness || "",
          therapy_types: t.therapy_types || "",
          session_fee_chat: t.session_fee_chat || 0,
          session_fee_in_person: t.session_fee_in_person || 0,
        });
      }
    };

    loadProfileData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.updateTherapistProfile(form);
      if (res.success && therapist) {
        const updated = { ...therapist, ...form };
        localStorage.setItem("therapist", JSON.stringify(updated));
        setTherapist(updated);
        setEditing(false);
        setSuccessMsg("Profile updated successfully.");
      }
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to update profile.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AlertMessages error={errorMsg} success={successMsg} />
      <div className="border-b pb-4" style={{ borderBottomColor: "rgba(107, 76, 147, 0.1)" }}>
        <h2 className={styles.sectionTitle}>Clinical Profile</h2>
        <p className={styles.sectionSubtitle}>Parameters visible in patient search directories.</p>
      </div>

      <form onSubmit={handleSave} className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Specialization</label>
          <input type="text" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} disabled={!editing} className={styles.formInput} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Phone</label>
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} className={styles.formInput} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Years of Experience</label>
          <input type="number" value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })} disabled={!editing} className={styles.formInput} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>DSM-5 Awareness</label>
          <select value={form.dsm_awareness} onChange={(e) => setForm({ ...form, dsm_awareness: e.target.value })} disabled={!editing} className={styles.formInput}>
            <option value="">Select level</option>
            <option value="expert">Expert</option>
            <option value="proficient">Proficient</option>
            <option value="basic">Basic</option>
          </select>
        </div>
        
        {/* Session type consultancy fees */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Online Consultancy (Chat) Fee (INR)</label>
          <input type="number" step="0.01" min="0" value={form.session_fee_chat} onChange={(e) => setForm({ ...form, session_fee_chat: parseFloat(e.target.value) || 0 })} disabled={!editing} className={styles.formInput} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Offline Consultancy (In-Person) Fee (INR)</label>
          <input type="number" step="0.01" min="0" value={form.session_fee_in_person} onChange={(e) => setForm({ ...form, session_fee_in_person: parseFloat(e.target.value) || 0 })} disabled={!editing} className={styles.formInput} />
        </div>

        <div className="md:col-span-2">
          <label className={styles.formLabel}>Therapy Focus Areas</label>
          <textarea rows={3} value={form.therapy_types} onChange={(e) => setForm({ ...form, therapy_types: e.target.value })} disabled={!editing} className={styles.formInput} style={{ fontFamily: "inherit", resize: "vertical" }} />
        </div>
        <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t pt-4" style={{ borderTopColor: "rgba(107, 76, 147, 0.1)" }}>
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)} className={styles.cancelButton}>Cancel</button>
              <button type="submit" className={styles.primaryButton}><Save className="h-4 w-4" /> Save</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={styles.primaryButton} style={{ background: "#fff", color: "#6B4C93", border: "1px solid rgba(107, 76, 147, 0.3)" }}>
              <Edit3 className="h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
