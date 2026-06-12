"use client";

import { useEffect, useState } from "react";
import { Key, Plus, X } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { AlertMessages } from "../Alerts";
import { ReferralCode } from "../types";
import styles from "../TherapistDashboard.module.scss";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralCode[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    const res = await api.getReferralCodes();
    if (res.success) setReferrals(res.codes || []);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload: { usage_limit?: number; expires_at?: string } = {};
      if (usageLimit) payload.usage_limit = parseInt(usageLimit);
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
      const res = await api.generateReferralCode(payload);
      if (res.success) {
        setSuccessMsg("Referral code generated.");
        setUsageLimit("");
        setExpiresAt("");
        setShowGenModal(false);
        load();
      }
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to generate code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this referral code?")) return;
    try {
      await api.revokeReferralCode(id);
      load();
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to revoke.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this referral code permanently? This action cannot be undone.")) return;
    try {
      await api.deleteReferralCode(id);
      setSuccessMsg('Referral code deleted.');
      load();
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to delete.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <AlertMessages error={errorMsg} success={successMsg} />
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Referral Code Safe</h2>
          <p className={styles.sectionSubtitle}>Generate secure patient referral pathways.</p>
        </div>
        <button onClick={() => setShowGenModal(true)} className={styles.primaryButton}>
          <Plus className="h-4 w-4" /> Generate New Code
        </button>
      </div>

      {showGenModal && (
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}><Key className="h-4 w-4" /> New Referral Code</h3>
            <button onClick={() => setShowGenModal(false)} className={styles.closeButton}><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleCreate} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Usage Limit (Optional)</label>
              <input type="number" min="1" placeholder="Unlimited" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className={styles.formInput} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expiration (Optional)</label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={styles.formInput} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setShowGenModal(false)} className={styles.cancelButton}>Cancel</button>
              <button type="submit" disabled={isSubmitting} className={styles.primaryButton}>{isSubmitting ? "Generating..." : "Generate"}</button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Code</th>
              <th className={styles.th}>Created</th>
              <th className={styles.th}>Expiration</th>
              <th className={styles.th}>Usage</th>
              <th className={styles.th}>Status</th>
              <th className={`${styles.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr><td colSpan={6} className={`${styles.td} text-center`}>No referral codes yet.</td></tr>
            ) : referrals.map((r) => {
              const expired = r.expires_at ? new Date(r.expires_at).getTime() < Date.now() : false;
              const limitReached = r.usage_limit ? r.usage_count >= r.usage_limit : false;
              return (
                <tr key={r.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.codeCell}`}>{r.code}</td>
                  <td className={styles.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className={styles.td}>{r.expires_at ? new Date(r.expires_at).toLocaleString() : "Never"}</td>
                  <td className={styles.td}>{r.usage_count} / {r.usage_limit ?? "∞"}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badgeStatus} ${r.is_revoked || expired || limitReached ? styles.revoked : styles.active}`}>
                      {r.is_revoked ? "Revoked" : expired ? "Expired" : limitReached ? "Limit Reached" : "Active"}
                    </span>
                  </td>
                  <td className={`${styles.td} text-right`}>
                    {!r.is_revoked && <button onClick={() => handleRevoke(r.id)} className={styles.actionLink}>Revoke</button>}
                    {r.is_revoked && <button onClick={() => handleDelete(r.id)} className={styles.actionLink}>Delete</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
