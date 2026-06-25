"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, Video, MapPin, X, Calendar, Sparkles } from "lucide-react";
import { patientApi } from "../lib/api/patient";
import { tenantApi, V2Patient } from "../lib/api/tenant";

interface SessionReminderProps {
  role: "patient" | "therapist";
}

interface SimplifiedAppointment {
  id: string;
  type: string;
  starts_at: string;
  meeting_link?: string;
  patient_id?: string;
}

export default function SessionReminder({ role }: SessionReminderProps) {
  const [activeApt, setActiveApt] = useState<SimplifiedAppointment | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  
  const patientsRef = useRef<V2Patient[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch patient list once on mount (only for therapists)
  useEffect(() => {
    if (role === "therapist") {
      tenantApi.listPatients()
        .then((res) => {
          patientsRef.current = res.data || [];
        })
        .catch((err) => console.error("Error loading patient helper list for reminder:", err));
    }
  }, [role]);

  // 2. Periodic appointment check (every 30 seconds)
  useEffect(() => {
    const checkUpcomingAppointments = async () => {
      try {
        let appointments: SimplifiedAppointment[] = [];

        if (role === "patient") {
          const res = await patientApi.listAppointments();
          appointments = (res.data || []).map(a => ({
            id: a.id,
            type: a.type,
            starts_at: a.starts_at,
            meeting_link: a.meeting_link
          }));
        } else {
          const res = await tenantApi.listAppointments();
          appointments = (res.data || []).map(a => ({
            id: a.id,
            type: a.type,
            starts_at: a.starts_at,
            meeting_link: a.meeting_link,
            patient_id: a.patient_id
          }));
        }

        const now = Date.now();
        const FIVE_MIN_MS = 5 * 60 * 1000;

        // Find an appointment starting in 5 minutes
        const upcoming = appointments.find((apt) => {
          const startTime = new Date(apt.starts_at).getTime();
          const diff = startTime - now;

          // Check if starts in 0 to 5 minutes
          if (diff > 0 && diff <= FIVE_MIN_MS) {
            // Check if already notified/dismissed in this session
            const notified = sessionStorage.getItem(`alerted_apt_${apt.id}`);
            return !notified;
          }
          return false;
        });

        if (upcoming) {
          // If we found an upcoming appointment, retrieve patient name if therapist
          if (role === "therapist" && upcoming.patient_id) {
            const p = patientsRef.current.find(pat => pat.id === upcoming.patient_id);
            setPatientName(p ? p.full_name : upcoming.patient_id.slice(0, 8));
          }
          setActiveApt(upcoming);
        }
      } catch (err) {
        console.error("Failed to fetch appointments for pre-session check:", err);
      }
    };

    // Check immediately on mount, then every 30s
    checkUpcomingAppointments();
    const pollInterval = setInterval(checkUpcomingAppointments, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [role]);

  // 3. Countdown timer handler (seconds tick)
  useEffect(() => {
    if (!activeApt) {
      setTimeLeft("");
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      return;
    }

    const updateCountdown = () => {
      const diffMs = new Date(activeApt.starts_at).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeft("Started!");
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setTimeLeft(`${min}m ${sec.toString().padStart(2, "0")}s`);
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [activeApt]);

  const handleDismiss = () => {
    if (activeApt) {
      sessionStorage.setItem(`alerted_apt_${activeApt.id}`, "true");
    }
    setActiveApt(null);
  };

  if (!activeApt) return null;

  return (
    <div style={modalOverlayStyles}>
      <div style={glassCardStyles}>
        {/* Close Button */}
        <button onClick={handleDismiss} style={closeBtnStyles} title="Dismiss">
          <X className="h-5 w-5" />
        </button>

        {/* Decorative Badge */}
        <div style={badgeStyles}>
          <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" />
          <span>Upcoming Session</span>
        </div>

        {/* Main Content */}
        <h2 style={titleStyles}>Session Starting Soon</h2>
        
        <p style={subtitleStyles}>
          {role === "patient" 
            ? "Your scheduled session starts in just a few minutes. Please get ready."
            : `Your scheduled session with ${patientName} starts in just a few minutes.`}
        </p>

        {/* Countdown Timer */}
        <div style={timerBoxStyles}>
          <Clock className="h-6 w-6 text-purple-400" />
          <span style={timerTextStyles}>{timeLeft}</span>
        </div>

        {/* Appointment details */}
        <div style={detailContainerStyles}>
          <div style={detailItemStyles}>
            <Calendar className="h-4 w-4 text-purple-300" />
            <span style={detailTextStyles}>
              Time: {new Date(activeApt.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div style={detailItemStyles}>
            {activeApt.type === "online" ? (
              <>
                <Video className="h-4 w-4 text-purple-300" />
                <span style={detailTextStyles}>Online Session</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-purple-300" />
                <span style={detailTextStyles}>In-Person / Office Session</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={actionContainerStyles}>
          {activeApt.type === "online" && activeApt.meeting_link && (
            <a 
              href={activeApt.meeting_link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={joinBtnStyles}
              onClick={handleDismiss}
            >
              Join Video Meeting
            </a>
          )}
          <button onClick={handleDismiss} style={dismissBtnStyles}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline CSS for advanced glassmorphism and modern UI styling
const modalOverlayStyles: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(10, 10, 20, 0.65)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: "1rem",
};

const glassCardStyles: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(30, 25, 50, 0.85) 0%, rgba(15, 10, 25, 0.95) 100%)",
  border: "1px solid rgba(139, 92, 246, 0.35)",
  borderRadius: "1.5rem",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), 0 0 25px rgba(139, 92, 246, 0.25)",
  padding: "2.5rem 2rem 2rem 2rem",
  width: "100%",
  maxWidth: "440px",
  color: "#f3f4f6",
  position: "relative",
  textAlign: "center",
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  transform: "scale(1)",
  transition: "transform 0.2s ease",
};

const closeBtnStyles: React.CSSProperties = {
  position: "absolute",
  top: "1.25rem",
  right: "1.25rem",
  background: "none",
  border: "none",
  color: "rgba(255, 255, 255, 0.5)",
  cursor: "pointer",
  transition: "color 0.2s ease",
  outline: "none",
};

const badgeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.35rem 0.85rem",
  borderRadius: "999px",
  backgroundColor: "rgba(139, 92, 246, 0.15)",
  border: "1px solid rgba(139, 92, 246, 0.3)",
  color: "#c084fc",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "1rem",
};

const titleStyles: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 700,
  margin: "0 0 0.75rem 0",
  letterSpacing: "-0.015em",
  background: "linear-gradient(to right, #f3f4f6, #c084fc)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const subtitleStyles: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "rgba(243, 244, 246, 0.75)",
  lineHeight: 1.5,
  margin: "0 0 1.5rem 0",
};

const timerBoxStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  padding: "1rem 2rem",
  borderRadius: "1rem",
  backgroundColor: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  width: "100%",
  marginBottom: "1.5rem",
};

const timerTextStyles: React.CSSProperties = {
  fontSize: "1.85rem",
  fontWeight: 800,
  color: "#f3f4f6",
  fontVariantNumeric: "tabular-nums",
  letterSpacing: "-0.02em",
};

const detailContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  width: "100%",
  marginBottom: "2rem",
  padding: "0.75rem",
  borderRadius: "0.75rem",
  backgroundColor: "rgba(0, 0, 0, 0.15)",
};

const detailItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  fontSize: "0.85rem",
  color: "rgba(243, 244, 246, 0.8)",
  justifyContent: "center",
};

const detailTextStyles: React.CSSProperties = {
  fontWeight: 500,
};

const actionContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  width: "100%",
};

const joinBtnStyles: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.95rem",
  borderRadius: "0.85rem",
  background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "0.95rem",
  textAlign: "center",
  border: "none",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
};

const dismissBtnStyles: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem",
  borderRadius: "0.85rem",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  color: "rgba(255, 255, 255, 0.75)",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
};
