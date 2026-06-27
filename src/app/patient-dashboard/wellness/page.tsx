"use client";

import { useEffect, useState } from "react";
import { patientApi, PatientApiError, WellnessEntry } from "../../lib/api/patient";
import { Heart, Calendar, AlertCircle, Sparkles, Smile, MessageSquare, Activity } from "lucide-react";

export default function WellnessPage() {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [mood, setMood] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    patientApi.listWellness()
      .then((r) => setEntries(r.data || []))
      .catch((e) => setError((e as PatientApiError).message));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await patientApi.logWellness({
        metrics: { mood, anxiety },
        reflection,
      });
      setSuccess("Your wellness log for today has been saved successfully!");
      setReflection("");
      load();
      // Auto-clear success message after 4 seconds
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError((err as PatientApiError).message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for mood emoji state details
  const getMoodDetails = (val: number) => {
    if (val <= 2) return { emoji: "😢", label: "Very Low", color: "text-blue-400", barColor: "bg-blue-500", bg: "bg-blue-500/10 border-blue-500/20 text-blue-300" };
    if (val <= 4) return { emoji: "🙁", label: "Low", color: "text-cyan-400", barColor: "bg-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" };
    if (val <= 6) return { emoji: "😐", label: "Neutral", color: "text-yellow-400", barColor: "bg-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300" };
    if (val <= 8) return { emoji: "🙂", label: "Good", color: "text-emerald-400", barColor: "bg-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" };
    return { emoji: "😁", label: "Excellent", color: "text-green-400", barColor: "bg-green-500", bg: "bg-green-500/10 border-green-500/20 text-green-300" };
  };

  // Helper for anxiety emoji state details
  const getAnxietyDetails = (val: number) => {
    if (val <= 2) return { emoji: "😌", label: "Calm", color: "text-green-400", barColor: "bg-green-500", bg: "bg-green-500/10 border-green-500/20 text-green-300" };
    if (val <= 4) return { emoji: "🙂", label: "Mild", color: "text-emerald-400", barColor: "bg-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" };
    if (val <= 6) return { emoji: "😐", label: "Moderate", color: "text-yellow-400", barColor: "bg-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300" };
    if (val <= 8) return { emoji: "😰", label: "High", color: "text-orange-400", barColor: "bg-orange-500", bg: "bg-orange-500/10 border-orange-500/20 text-orange-300" };
    return { emoji: "😱", label: "Severe", color: "text-red-400 font-medium", barColor: "bg-red-500", bg: "bg-red-500/10 border-red-500/20 text-red-300" };
  };

  const moodState = getMoodDetails(mood);
  const anxietyState = getAnxietyDetails(anxiety);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-emerald-400">
          <Heart className="h-6 w-6 animate-pulse" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Daily Wellness</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Take a moment to check in with yourself. Track your mood, monitor anxiety, and jot down reflections to observe your mental wellness trends over time.
        </p>
      </div>

      {/* Main Form Section */}
      <div className="grid grid-cols-1 gap-6">
        <form onSubmit={submit} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-6 transition-all duration-300">
          
          {/* Status Messages */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-fadeIn">
              <Sparkles className="h-5 w-5 text-emerald-400 flex-shrink-0 animate-bounce" />
              <span>{success}</span>
            </div>
          )}

          {/* Form Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Mood Slider Card */}
            <div className="flex flex-col gap-4 bg-slate-900/35 border border-slate-800/60 rounded-xl p-5 hover:border-slate-800 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-200">How is your mood?</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${moodState.bg}`}>
                  {moodState.emoji} {moodState.label}
                </span>
              </div>
              
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <span className="text-5xl select-none">{moodState.emoji}</span>
                  <div className="text-3xl font-bold mt-2 text-white">{mood} <span className="text-xs text-slate-400">/ 10</span></div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <input 
                  type="range" 
                  min={1} 
                  max={10} 
                  value={mood} 
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                  <span>Very Low</span>
                  <span>Neutral</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>

            {/* Anxiety Slider Card */}
            <div className="flex flex-col gap-4 bg-slate-900/35 border border-slate-800/60 rounded-xl p-5 hover:border-slate-800 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-200">How is your anxiety level?</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${anxietyState.bg}`}>
                  {anxietyState.emoji} {anxietyState.label}
                </span>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <span className="text-5xl select-none">{anxietyState.emoji}</span>
                  <div className="text-3xl font-bold mt-2 text-white">{anxiety} <span className="text-xs text-slate-400">/ 10</span></div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <input 
                  type="range" 
                  min={1} 
                  max={10} 
                  value={anxiety} 
                  onChange={(e) => setAnxiety(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 px-1">
                  <span>Calm</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>

          </div>

          {/* Reflection Field */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Daily Reflection
            </label>
            <textarea 
              rows={4} 
              placeholder="Write down any thoughts, feelings, triggers, or things you are grateful for today..." 
              value={reflection} 
              onChange={(e) => setReflection(e.target.value)} 
              className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Activity className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Save Today's Entry</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Entries Title */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center gap-2">
          <Smile className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Recent Entries</h3>
        </div>

        {/* Entries Layout */}
        {entries.length === 0 ? (
          <div className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-8 text-center">
            <Calendar className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No wellness entries logged yet. Your dashboard logs will show up here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.slice(0, 8).map((e, i) => {
              const itemMoodVal = e.metrics.mood ?? 5;
              const itemAnxietyVal = e.metrics.anxiety ?? 5;
              const itemMood = getMoodDetails(itemMoodVal);
              const itemAnxiety = getAnxietyDetails(itemAnxietyVal);

              return (
                <div 
                  key={e.id ? String(e.id) : i} 
                  className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-5 hover:border-emerald-500/20 transition-all duration-300 flex flex-col gap-4 shadow-md"
                >
                  {/* Date and Header */}
                  <div className="flex justify-between items-center border-bottom border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(e.entry_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Metrics Badges */}
                  <div className="flex gap-2">
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${itemMood.bg}`}>
                      <span>Mood: {itemMoodVal} {itemMood.emoji}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${itemAnxiety.bg}`}>
                      <span>Anxiety: {itemAnxietyVal} {itemAnxiety.emoji}</span>
                    </div>
                  </div>

                  {/* Reflection Blockquote */}
                  {e.reflection ? (
                    <div className="text-xs italic text-slate-300 border-l-2 border-emerald-500/40 pl-3 py-1 bg-slate-950/20 rounded-r-md">
                      "{e.reflection}"
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic pl-1">
                      No reflection noted.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
