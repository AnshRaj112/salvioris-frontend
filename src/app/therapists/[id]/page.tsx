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
  const [isLoading, setIsLoading] = useState(true);
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

          {/* Booking Trigger Panel (Right column) */}
          <div className={styles.connectionPanel}>
            <h4 className={styles.panelTitle}>
              <Lock className="h-4 w-4 text-emerald-400" style={{ marginRight: '0.25rem' }} /> Schedule Consultancy
            </h4>

            <p className={styles.panelText} style={{ marginBottom: "1.5rem" }}>
              Book an online or offline consultancy session directly with Dr. {t.name}. Booking a session automatically connects you.
            </p>

            <Link 
              href={`/therapists/${t.id}/book`}
              className={styles.connectButton}
              style={{ 
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                color: "#fff", 
                textAlign: "center",
                display: "block",
                marginBottom: "1rem",
                textDecoration: "none",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
              }}
            >
              Book a Session
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
