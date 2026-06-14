"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Trash2, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { tenantApi, V2AvailabilitySlot } from "../../lib/api/tenant";
import { AlertMessages } from "../Alerts";
import styles from "../TherapistDashboard.module.scss";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<V2AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Default to Monday
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [duration, setDuration] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAvailability = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await tenantApi.listAvailability();
      setSlots(res.data || []);
    } catch (err) {
      setErrorMsg("Failed to load availability slots. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    if (startTime >= endTime) {
      setErrorMsg("Start time must be strictly before end time.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Send time in HH:MM format
      await tenantApi.createAvailability({
        day_of_week: dayOfWeek,
        start_time: startTime + ":00",
        end_time: endTime + ":00",
        slot_duration_min: duration,
      });
      setSuccessMsg("Working slot successfully added.");
      loadAvailability();
    } catch (err) {
      setErrorMsg((err as Error).message || "Failed to add slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this availability slot?")) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await tenantApi.deleteAvailability(id);
      setSuccessMsg("Availability slot deleted.");
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setErrorMsg("Failed to delete the slot.");
    }
  };

  // Group slots by day
  const groupedSlots = DAYS_OF_WEEK.map((dayName, idx) => {
    const daySlots = slots.filter((s) => s.day_of_week === idx);
    return { dayName, idx, slots: daySlots };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b pb-4" style={{ borderBottomColor: "rgba(107, 76, 147, 0.1)" }}>
        <h2 className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock className="h-5 w-5" /> Working Hours & Availability
        </h2>
        <p className={styles.sectionSubtitle}>
          Define active schedule ranges for patient booking. Patients can schedule appointments within these hours.
        </p>
      </div>

      <AlertMessages error={errorMsg} success={successMsg} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form to add slot */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddSlot} className={styles.modal} style={{ margin: 0, position: "sticky", top: "1rem" }}>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-purple-800" style={{ margin: 0, paddingBottom: "0.5rem", borderBottom: "1px solid rgba(107, 76, 147, 0.1)" }}>
              <Plus className="h-4 w-4" /> Add Working Hours
            </h3>

            <div className="flex flex-col gap-4 mt-2">
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Day of Week</label>
                <select 
                  className={styles.formInput} 
                  value={dayOfWeek} 
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                  required
                >
                  {DAYS_OF_WEEK.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input 
                    type="time" 
                    className={styles.formInput} 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Time</label>
                  <input 
                    type="time" 
                    className={styles.formInput} 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Slot Duration (Minutes)</label>
                <input 
                  type="number" 
                  min="15" 
                  max="180" 
                  className={styles.formInput} 
                  value={duration} 
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)} 
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={styles.primaryButton}
                style={{ justifyContent: "center", marginTop: "0.5rem" }}
              >
                {isSubmitting ? "Adding..." : "Add Hours Range"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List of slots */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-purple-800" style={{ margin: 0 }}>
            Active Working Schedules
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 bg-white border rounded-2xl" style={{ border: "1px solid rgba(107, 76, 147, 0.12)" }}>
              Loading active slots...
            </div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white border rounded-2xl" style={{ border: "1px solid rgba(107, 76, 147, 0.12)" }}>
              <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              No working hours configured yet. Please use the form to configure your daily working slots.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {groupedSlots.map((group) => {
                if (group.slots.length === 0) return null;
                return (
                  <div 
                    key={group.idx} 
                    className="p-4 bg-white/70 backdrop-blur border rounded-2xl flex flex-col gap-2.5" 
                    style={{ border: "1px solid rgba(107, 76, 147, 0.12)" }}
                  >
                    <h4 className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {group.dayName}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.slots.map((slot) => (
                        <div 
                          key={slot.id} 
                          className="flex items-center justify-between p-2.5 rounded-xl border bg-white" 
                          style={{ border: "1px solid rgba(107, 76, 147, 0.08)" }}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Duration: {slot.slot_duration_min} mins
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
