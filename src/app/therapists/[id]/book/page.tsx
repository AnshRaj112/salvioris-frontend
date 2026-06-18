"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Clock, Video, MessageSquare, PhoneCall, 
  MapPin, Shield, CheckCircle, AlertCircle, CreditCard, Activity 
} from "lucide-react";
import { api, ApiError } from "../../../lib/api";
import { patientApi } from "../../../lib/api/patient";
import styles from "../TherapistProfile.module.scss";

interface TherapistBillingInfo {
  consultation_fee: number;
  session_fee: number;
  session_fee_in_person: number;
  session_fee_chat: number;
  session_fee_voice: number;
  session_fee_video: number;
  currency: string;
  gst_rate: number;
}

interface TherapistDetails {
  id: string;
  name: string;
  psychologist_type?: string;
  specialization?: string;
  billing_profile?: TherapistBillingInfo;
}

export default function BookSessionPage() {
  const params = useParams();
  const router = useRouter();
  const therapistId = params.id as string;

  const [t, setT] = useState<TherapistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form fields
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [sessionType, setSessionType] = useState<"in_person" | "chat">("chat");
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (therapistId) {
      loadTherapist();
    }
  }, [therapistId]);

  const loadTherapist = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTherapistDetails(therapistId);
      if (res.success && res.therapist) {
        setT(res.therapist as TherapistDetails);
      }
    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to load therapist details");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch availability slots when date changes
  useEffect(() => {
    if (!selectedDate || !therapistId) return;
    fetchSlots();
  }, [selectedDate, therapistId]);

  const fetchSlots = async () => {
    setIsSlotsLoading(true);
    setErrorMsg(null);
    setSelectedSlot(null);
    try {
      const res = await patientApi.getTherapistAvailability(therapistId, selectedDate);
      setSlots(res.data || []);
    } catch (err) {
      setErrorMsg("Could not fetch available slots. Make sure date format is correct.");
    } finally {
      setIsSlotsLoading(false);
    }
  };

  // Helper to load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Initiate booking checkout
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setErrorMsg("Please select a session date");
      return;
    }
    if (!selectedSlot) {
      setErrorMsg("Please select an available time slot");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Construct RFC3339 timestamp for selected slot start in local timezone and convert to UTC ISO string
      const localDateTimeStr = `${selectedDate}T${selectedSlot.start}`;
      const startsAtStr = new Date(localDateTimeStr).toISOString();
      
      // 2. Call initiate API
      const bookingData = await patientApi.initiateBooking({
        therapist_id: therapistId,
        type: sessionType,
        starts_at: startsAtStr,
        notes: notes || undefined
      });

      // 3. Load Razorpay script
      const rzpLoaded = await loadRazorpay();
      if (!rzpLoaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay payment client. Please check your internet connection.");
      }

      // 4. Open Razorpay payment gateway
      const options = {
        key: bookingData.key_id,
        amount: bookingData.amount,
        currency: bookingData.currency,
        name: "SALVIORIS CLINICAL",
        description: `Therapy Booking: Dr. ${t?.name}`,
        order_id: bookingData.order_id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setIsSubmitting(true);
          try {
            // 5. Verify signature
            await patientApi.verifyBookingPayment({
              invoice_id: bookingData.invoice_id,
              appointment_id: bookingData.appointment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setSuccessMsg("Booking Successful! Appointment is confirmed and calendar events updated.");
            router.push("/patient-dashboard/appointments");
          } catch (err) {
            setErrorMsg((err as Error).message || "Verification failed. Please contact support.");
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setErrorMsg("Payment flow was cancelled.");
            setIsSubmitting(false);
          }
        },
        theme: {
          color: "#7c3aed"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setErrorMsg((err as ApiError).message || "Failed to initiate booking checkout.");
      setIsSubmitting(false);
    }
  };

  const getFeeDisplay = () => {
    if (!t || !t.billing_profile) return "Loading...";
    const bp = t.billing_profile;
    let fee = 0;
    switch (sessionType) {
      case "in_person": fee = bp.session_fee_in_person; break;
      case "chat": fee = bp.session_fee_chat; break;
    }
    if (fee === 0) {
      fee = sessionType === "in_person" ? bp.session_fee : (bp.consultation_fee || bp.session_fee);
    }
    if (fee === 0) fee = 1000;
    
    // Add estimated GST
    const gst = Math.round(fee * (bp.gst_rate || 18) / 100);
    const total = fee + gst;
    
    return `${bp.currency || "INR"} ${total} (incl. GST)`;
  };

  // Calculate minimum date picker value (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (isLoading) {
    return (
      <div className={styles.profilePage} style={{ alignItems: "center", justifyContent: "center" }}>
        <Activity className="h-8 w-8 text-emerald-400 animate-spin" />
        <span className="text-xs text-slate-500 mt-2">Loading scheduling profile...</span>
      </div>
    );
  }

  if (!t) return null;

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <header className={styles.header}>
        <Link href={`/therapists/${therapistId}`} className={styles.backLink}>
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </Link>
        <h1 className={styles.headerTitle}>Schedule Session</h1>
      </header>

      {/* Main Container */}
      <main className={styles.mainContainer} style={{ maxWidth: "800px" }}>
        {successMsg && (
          <div className={styles.successAlert}>
            <CheckCircle className="h-5 w-5" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorAlert}>
            <AlertCircle className="h-5 w-5" /> {errorMsg}
          </div>
        )}

        <div className={styles.profileCard} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <h2 className={styles.therapistName}>Book Dr. {t.name}</h2>
            <p className="text-xs text-emerald-400 font-semibold">{t.psychologist_type || "Licensed Specialist"}</p>
            <p className="text-xs text-slate-400 mt-1">Specializes in {t.specialization || "Clinical Therapy"}</p>
          </div>

          <form onSubmit={handleBooking} className="flex flex-col gap-5 border-t pt-4" style={{ borderTopColor: "rgba(255,255,255,0.05)" }}>
            
            {/* Step 1: Session type */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">1. Choose Format</label>
              <div className="grid grid-cols-2 gap-3">
                
                <button
                  type="button"
                  onClick={() => setSessionType("chat")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-medium transition-all ${
                    sessionType === "chat" 
                      ? "bg-purple-600/10 border-purple-500 text-purple-400" 
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" /> Online (Chat)
                </button>

                <button
                  type="button"
                  onClick={() => setSessionType("in_person")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-medium transition-all ${
                    sessionType === "in_person" 
                      ? "bg-purple-600/10 border-purple-500 text-purple-400" 
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <MapPin className="h-4 w-4" /> Offline (In Person)
                </button>

              </div>
            </div>

            {/* Step 2: Date select */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">2. Select Session Date</label>
              <div style={{ position: "relative" }}>
                <Calendar className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="date"
                  min={getMinDate()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={styles.textarea}
                  style={{ paddingLeft: "2.5rem", height: "2.5rem", borderRadius: "1rem" }}
                  required
                />
              </div>
            </div>

            {/* Step 3: Slot select */}
            {selectedDate && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  3. Select Available Slot (cross-referenced with doctor&apos;s Calendar)
                </label>
                
                {isSlotsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                    <Clock className="h-4 w-4 animate-spin text-purple-500" /> Checking calendar blocks...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/15 p-3 rounded-xl">
                    No active slots available for this date. Please select another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot, index) => {
                      const isSelected = selectedSlot?.start === slot.start;
                      const formattedStart = slot.start.slice(0, 5); // "10:00"
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 text-slate-900 border-emerald-400"
                              : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          {formattedStart}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Notes */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">4. Add Introductory Note (Optional)</label>
              <textarea
                rows={3}
                placeholder="Give a brief context about the session topics..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.textarea}
              />
            </div>

            {/* Price display and pay trigger */}
            <div className="border-t pt-4 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTopColor: "rgba(255,255,255,0.05)" }}>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-450 block tracking-wider">Total Session Fee</span>
                <span className="text-md font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                  <CreditCard className="h-4.5 w-4.5 text-emerald-400" /> {getFeeDisplay()}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedDate || !selectedSlot}
                className={styles.connectButton}
                style={{ 
                  width: "auto", 
                  padding: "0.75rem 2rem", 
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                }}
              >
                {isSubmitting ? "Processing Checkout..." : "Pay & Confirm Booking"}
              </button>
            </div>

            <div className="flex items-start gap-1.5 text-[10px] text-slate-500 mt-1 max-w-lg">
              <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Payments processed securely via Razorpay test gateway. Bookings are backed by HIPAA privacy safeguards and automatically synchronize with Google Calendar profiles.
              </span>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
