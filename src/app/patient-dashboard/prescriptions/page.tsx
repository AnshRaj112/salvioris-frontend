"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, PatientPrescription } from "../../lib/api/patient";
import styles from "../../therapist-dashboard/TherapistDashboard.module.scss";

export default function PrescriptionsPage() {
  const [items, setItems] = useState<PatientPrescription[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientApi.listPrescriptions("active")
      .then((r) => setItems(r.data || []))
      .catch((e) => setError((e as PatientApiError).message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: "#6B4C93" }}>Active Medicines</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {items.map((rx) => (
        <div key={rx.id} className={styles.noteCard}>
          <h4 className="text-sm font-bold">{rx.medicine_name}</h4>
          <p className="text-xs">{rx.dosage} · {rx.frequency}</p>
        </div>
      ))}
    </div>
  );
}
