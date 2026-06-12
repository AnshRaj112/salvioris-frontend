"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, User } from "lucide-react";
import { tenantApi, TenantApiError, V2Patient } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

export default function PatientsPage() {
  const [patients, setPatients] = useState<V2Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await tenantApi.listPatients();
      setPatients(res.data || []);
      setError(null);
    } catch (e) {
      setError((e as TenantApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.createPatient({ full_name: name, email: email || undefined });
      setName("");
      setEmail("");
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as TenantApiError).message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Patients (V2)</h2>
        <button onClick={() => setShowForm(!showForm)} className={styles.actionButton}>
          <Plus className="h-4 w-4" /> Add Patient
        </button>
      </div>
      <AlertMessages error={error} success={null} />

      {showForm && (
        <form onSubmit={handleCreate} className={styles.formCard}>
          <input className={styles.input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className={styles.input} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className={styles.primaryButton}>Create</button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : patients.length === 0 ? (
        <p className="text-sm text-slate-500">No patients yet. Add one or onboard via Referrals.</p>
      ) : (
        <div className="grid gap-3">
          {patients.map((p) => (
            <Link key={p.id} href={`/therapist-dashboard/patients/${p.id}`} className={styles.clientCard}>
              <User className="h-4 w-4" style={{ color: "#6B4C93" }} />
              <div>
                <h4 className="text-sm font-bold">{p.full_name}</h4>
                <p className="text-xs text-slate-500">{p.email || p.phone || p.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
