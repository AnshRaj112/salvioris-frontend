"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Award, Shield, MapPin, Calendar, Check, X, ArrowLeft, 
  Activity, Sparkles, AlertCircle, CheckCircle, Mail, Phone, Lock, BookOpen
} from "lucide-react";
import { api, ApiError } from "../../lib/api";
import styles from "./TherapistProfile.module.scss";

interface TherapistProfile {
  id: string;
  name: string;
  created_at: string;
  license_state: string;
  years_of_experience: number;
  specialization?: string;
  college_degree?: string;
  masters_institution?: string;
  psychologist_type?: string;
  successful_cases?: number;
  therapy_types?: string;
  availability_status: string;
  is_connected: boolean;
  connection_request_status?: string; // "pending", "approved", "rejected", or ""
}

export default function TherapistProfileView() {
  const params = useParams();
  const router = useRouter();
  const therapistId = params.id as string;

  const [t, setT] = useState<TherapistProfile | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isCheckedConsent, setIsCheckedConsent] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (therapistId) {
      loadProfile();
    }
  }, [therapistId]);

  const loadProfile = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getTherapistDetails(therapistId);
      if (res.success && res.therapist) {
        setT(res.therapist as TherapistProfile);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to load therapist profile details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCheckedConsent) {
      setErrorMsg("You must explicitly review and check the profile data sharing consent check box to proceed.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.requestConnection(therapistId, noteText || undefined);
      if (res.success) {
        setSuccessMsg("Your connection request has been successfully submitted! Awaiting therapist approval.");
        setShowConsentModal(false);
        setNoteText("");
        setIsCheckedConsent(false);
        loadProfile();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to submit connection request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to end this connection? This unlinks your account relation and immediately revokes all profile viewing consent.")) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.disconnectTherapist(therapistId);
      if (res.success) {
        setSuccessMsg("You have successfully disconnected from this therapist. Viewing consent has been fully revoked.");
        loadProfile();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to disconnect from therapist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.profilePage} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Activity className="h-8 w-8 text-emerald-400 animate-spin" />
        <span className="text-xs text-slate-500 mt-2">Loading profile details...</span>
      </div>
    );
  }

  if (errorMsg && !t) {
    return (
      <div className={styles.profilePage} style={{ alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
        <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
        <h3 className="text-sm font-bold text-white">Error Loading Profile</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{errorMsg}</p>
        <Link href="/therapists" className="mt-4 text-xs text-emerald-400 hover:underline">
          Return to directory
        </Link>
      </div>
    );
  }

  if (!t) return null;

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <header className={styles.header}>
        <Link 
          href="/therapists" 
          className={styles.backLink}
        >
          <ArrowLeft className="h-4 w-4" style={{ marginRight: '0.25rem' }} /> Back to Directory
        </Link>

        <h1 className={styles.headerTitle}>Therapist Profile</h1>
      </header>

      {/* Main Container */}
      <main className={styles.mainContainer}>
        
        {successMsg && (
          <div className={styles.successAlert}>
            <CheckCircle className="h-5 w-5" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle className="h-5 w-5" />
            {errorMsg}
          </div>
        )}

        {/* Profile Card */}
        <section className={styles.profileCard}>
          <div className={styles.bioSection}>
            
            {/* Dr. Details */}
            <div>
              <div className={styles.nameRow}>
                <h2 className={styles.therapistName}>Dr. {t.name}</h2>
                <span className={styles.verifiedBadge}>
                  Verified Partner
                </span>
              </div>
              <p className={styles.psychType}>{t.psychologist_type || "Licensed Practitioner"}</p>
            </div>

            {/* Badges */}
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <MapPin className="h-4 w-4 text-slate-500" style={{ marginRight: '0.25rem' }} /> licensed in {t.license_state}
              </span>
              <span className={styles.metaItem}>
                <Award className="h-4 w-4 text-slate-500" style={{ marginRight: '0.25rem' }} /> {t.years_of_experience} Years Professional Experience
              </span>
              <span className={styles.metaItem}>
                <Activity className="h-4 w-4 text-slate-500" style={{ marginRight: '0.25rem' }} /> Status: {t.availability_status}
              </span>
            </div>

            {/* Specialties and Education */}
            <div className={styles.detailsGrid}>
              <div className={styles.detailCol}>
                <h4 className={styles.colHeader}>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Clinical Specialty
                </h4>
                <p className={styles.colValue} style={{ fontWeight: 600 }}>{t.specialization || "General Family Practice"}</p>
              </div>

              <div className={styles.detailCol}>
                <h4 className={styles.colHeader}>
                  <BookOpen className="h-3.5 w-3.5 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Education Background
                </h4>
                <p className={styles.colValue}>
                  Degree: <strong className="text-slate-200">{t.college_degree || "Masters of Psychology"}</strong><br />
                  Institution: <strong className="text-slate-200">{t.masters_institution || "State University School of Medicine"}</strong>
                </p>
              </div>
            </div>

            {/* Therapy styles focus list */}
            {t.therapy_types && (
              <div className={styles.methodsContainer}>
                <h4 className={styles.methodsTitle}>Methodologies Used</h4>
                <div className={styles.tagContainer}>
                  {t.therapy_types.split(",").map((type, idx) => (
                    <span key={idx} className={styles.tag}>
                      {type.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Connection Trigger Card (Right column) */}
          <div className={styles.connectionPanel}>
            <h4 className={styles.panelTitle}>
              <Lock className="h-4 w-4 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Relationship Lifecycle
            </h4>

            {t.is_connected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.connectedBadge}>
                  <Check className="h-4 w-4" /> Connected & Profile Shared
                </div>
                <p className={styles.panelText}>
                  You have active connection status and shared profile consent with this therapist. You can end this relation at any time.
                </p>
                <button 
                  onClick={handleDisconnect}
                  disabled={isSubmitting}
                  className={styles.disconnectButton}
                >
                  Disconnect Relationship
                </button>
              </div>
            ) : t.connection_request_status === "pending" ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className={styles.pendingBadge}>
                  <Activity className="h-4 w-4 animate-pulse text-emerald-400" /> Connection Pending Approval
                </div>
                <p className={styles.panelText}>
                  Your profile connection request has been sent to Dr. {t.name} and is awaiting clinical approval.
                </p>
              </div>
            ) : t.connection_request_status === "rejected" ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className={styles.rejectedBadge}>
                  <X className="h-4 w-4" /> Request Declined
                </div>
                <p className={styles.panelText}>
                  Your request was declined. You can choose to resubmit or request connection again.
                </p>
                <button 
                  onClick={() => setShowConsentModal(true)}
                  className={styles.connectButton}
                >
                  Request Connection Again
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p className={styles.panelText}>
                  Link with this therapist directly to establish in-platform secure communication and enable therapeutic scheduling.
                </p>
                <button 
                  onClick={() => setShowConsentModal(true)}
                  className={styles.connectButton}
                >
                  Connect with Therapist
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECURE PATIENT CONSENT PROMPT MODAL */}
        {showConsentModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <Shield className="h-4.5 w-4.5 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Patient Privacy & Consent Agreement
                </h3>
                <button 
                  onClick={() => setShowConsentModal(false)}
                  className={styles.closeButton}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={styles.consentCard}>
                <h4 className={styles.consentTitle}>
                  <Lock className="h-3.5 w-3.5" style={{ marginRight: '0.25rem' }} /> What are you sharing?
                </h4>
                <p className={styles.consentText}>
                  By confirming this connection request, you explicitly authorize Dr. <strong>{t.name}</strong> to:
                </p>
                <ul className={styles.consentList}>
                  <li>View your chosen anonymous <strong>username</strong></li>
                  <li>View your account <strong>registration timestamp</strong></li>
                  <li>Link inside their clinical connected-user registry</li>
                </ul>
                <p className={styles.consentMinimization}>
                  Your private account recovery data (recovery email, recovery phone, device tracking logs) remains encrypted and <strong>strictly hidden</strong> from the therapist at all times.
                </p>
              </div>

              {/* Introduction Note form */}
              <form onSubmit={handleRequestConnection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label className={styles.noteLabel}>
                    Introductory Message / Note <span className={styles.noteCharCount}>{noteText.length}/300 chars</span>
                  </label>
                  <textarea 
                    rows={3}
                    maxLength={300}
                    placeholder="Enter an optional brief greeting or diagnostic interest (e.g. looking for help managing anxiety)..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className={styles.textarea}
                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                {/* Checklist Consent */}
                <div className={styles.checkboxContainer}>
                  <input 
                    type="checkbox" 
                    id="consentCheckbox"
                    checked={isCheckedConsent}
                    onChange={(e) => setIsCheckedConsent(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label htmlFor="consentCheckbox" className={styles.checkboxLabel}>
                    I explicitly understand that establishing this relationship grants Dr. {t.name} secure consent to view my anonymous patient profile in accordance with the HIPAA Privacy Safeguards.
                  </label>
                </div>

                <div className={styles.modalFooter}>
                  <button 
                    type="button" 
                    onClick={() => setShowConsentModal(false)}
                    className={styles.closeButton}
                    style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !isCheckedConsent}
                    className={styles.connectButton}
                    style={{ width: 'auto', padding: '0.625rem 1.25rem' }}
                  >
                    {isSubmitting ? "Submitting..." : "Grant Consent & Send"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
