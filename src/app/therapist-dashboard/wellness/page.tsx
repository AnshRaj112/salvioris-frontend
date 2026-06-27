"use client";

import { useEffect, useState, useMemo } from "react";
import {
  tenantApi,
  TenantApiError,
  V2Patient,
  WellnessEntry,
} from "../../lib/api/tenant";
import {
  Heart,
  Calendar,
  Search,
  User,
  AlertTriangle,
  AlertCircle,
  Coffee,
  Monitor,
  Droplets,
  Utensils,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  RefreshCw,
  Shield,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────── */
function moodState(v: number) {
  if (v <= 2) return { emoji: "😢", label: "Very Low", pill: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-400" };
  if (v <= 4) return { emoji: "🙁", label: "Low",      pill: "bg-cyan-100  text-cyan-700  border-cyan-200",  bar: "bg-cyan-400"  };
  if (v <= 6) return { emoji: "😐", label: "Neutral",  pill: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-400" };
  if (v <= 8) return { emoji: "🙂", label: "Good",     pill: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-400" };
  return              { emoji: "😁", label: "Excellent",pill: "bg-green-100  text-green-700  border-green-200",  bar: "bg-green-400"  };
}

function anxietyState(v: number) {
  if (v <= 2) return { emoji: "😌", label: "Calm",     pill: "bg-green-100 text-green-700 border-green-200",   bar: "bg-green-400" };
  if (v <= 4) return { emoji: "🙂", label: "Mild",     pill: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-400" };
  if (v <= 6) return { emoji: "😐", label: "Moderate", pill: "bg-amber-100 text-amber-700 border-amber-200",   bar: "bg-amber-400" };
  if (v <= 8) return { emoji: "😰", label: "High",     pill: "bg-orange-100 text-orange-700 border-orange-200",bar: "bg-orange-400" };
  return              { emoji: "😱", label: "Severe",   pill: "bg-red-100   text-red-700   border-red-200",     bar: "bg-red-500"   };
}

function foodLabel(v?: string) {
  if (v === "balanced")     return "Balanced 🥗";
  if (v === "skipped_meals") return "Skipped Meals 🚫";
  if (v === "fast_food")    return "Fast / Sugary 🍕";
  if (v === "unstructured") return "Unstructured 🍿";
  return v ?? "—";
}

function avg(vals: (number | undefined)[]): number | null {
  const nums = vals.filter((n): n is number => n !== undefined);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function trend(vals: (number | undefined)[]): "up" | "down" | "flat" {
  const nums = vals.filter((n): n is number => n !== undefined);
  if (nums.length < 2) return "flat";
  const first = nums[nums.length - 1]; // oldest first in backend sort desc → last in array
  const last = nums[0];
  if (last > first + 0.5) return "up";
  if (last < first - 0.5) return "down";
  return "flat";
}

/* mini sparkline using CSS flex-bars */
function Sparkline({ values, color }: { values: (number | undefined)[]; color: string }) {
  const nums = values.slice(0, 7).filter((n): n is number => n !== undefined);
  if (!nums.length) return <span className="text-xs text-gray-400">No data</span>;
  const max = Math.max(...nums, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {nums.reverse().map((v, i) => (
        <div
          key={i}
          className={`rounded-t flex-1 min-w-[6px] ${color}`}
          style={{ height: `${(v / max) * 100}%`, opacity: 0.7 + i * 0.04 }}
        />
      ))}
    </div>
  );
}

/* ─── main component ───────────────────────────────────────── */
export default function TherapistWellnessPage() {
  const [patients, setPatients]     = useState<V2Patient[]>([]);
  const [allEntries, setAllEntries] = useState<WellnessEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, wRes] = await Promise.all([
        tenantApi.listPatients(),
        tenantApi.listAllPatientsWellness(),
      ]);
      setPatients(pRes.data ?? []);
      setAllEntries(wRes.data ?? []);
    } catch (e) {
      setError((e as TenantApiError).message ?? "Failed to load wellness data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* patient map */
  const patientMap = useMemo(() => {
    const m = new Map<string, V2Patient>();
    patients.forEach((p) => m.set(p.id, p));
    return m;
  }, [patients]);

  /* entries per patient */
  const entriesByPatient = useMemo(() => {
    const m = new Map<string, WellnessEntry[]>();
    allEntries.forEach((e) => {
      const pid = e.patient_id ?? "";
      if (!m.has(pid)) m.set(pid, []);
      m.get(pid)!.push(e);
    });
    return m;
  }, [allEntries]);

  /* patients who have at least one entry, sorted by alert priority */
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) &&
        entriesByPatient.has(p.id)
      )
      .sort((a, b) => {
        const latest = (pid: string) => entriesByPatient.get(pid)?.[0];
        const score  = (e?: WellnessEntry) => {
          if (!e) return 0;
          let s = 0;
          if ((e.metrics.mood    ?? 5) <= 3) s += 2;
          if ((e.metrics.anxiety ?? 5) >= 8) s += 2;
          return s;
        };
        return score(latest(b.id)) - score(latest(a.id));
      });
  }, [patients, entriesByPatient, search]);

  const selectedEntries = selected ? (entriesByPatient.get(selected) ?? []) : [];
  const selectedPatient  = selected ? patientMap.get(selected)  : null;

  /* summary stats for selected patient */
  const stats = useMemo(() => {
    const moods     = selectedEntries.map((e) => e.metrics.mood);
    const anxieties = selectedEntries.map((e) => e.metrics.anxiety);
    const sleeps    = selectedEntries.map((e) => e.metrics.sleep_hours);
    const screens   = selectedEntries.map((e) => e.metrics.screen_time);
    const waters    = selectedEntries.map((e) => e.metrics.water_intake);
    return { moods, anxieties, sleeps, screens, waters };
  }, [selectedEntries]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-[#6B4C93]" />
          <h2 className="text-xl font-bold text-[#3b2055]">Patient Wellness Monitor</h2>
          {!loading && (
            <span className="text-xs bg-purple-100 text-[#6B4C93] border border-purple-200 font-semibold px-2.5 py-0.5 rounded-full">
              {filteredPatients.length} patients
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#6B4C93] bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Two-Panel Layout ────────────────────────────────── */}
      <div className="flex gap-4 min-h-0" style={{ height: "calc(100vh - 14rem)" }}>

        {/* LEFT: Patient selector panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-y-auto rounded-2xl bg-white/60 border border-purple-100 backdrop-blur-sm p-3 shadow-sm">
          {/* search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-purple-300" />
            <input
              type="text"
              placeholder="Search patients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-purple-100 rounded-lg text-[#3b2055] placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {loading ? (
            <p className="text-xs text-center text-purple-400 py-6">Loading…</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-xs text-center text-purple-400 py-6">No patients with wellness data found.</p>
          ) : (
            filteredPatients.map((p) => {
              const latest = entriesByPatient.get(p.id)?.[0];
              const hasLowMood = (latest?.metrics.mood    ?? 5) <= 3;
              const hasHighAnx = (latest?.metrics.anxiety ?? 5) >= 8;
              const isAlert    = hasLowMood || hasHighAnx;
              const isActive   = selected === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 border transition-all duration-200 flex items-center gap-2.5 group ${
                    isActive
                      ? "bg-[#6B4C93] text-white border-[#6B4C93] shadow-md"
                      : "bg-white text-[#3b2055] border-purple-100 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-purple-100 text-[#6B4C93]"
                  }`}>
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold truncate">{p.full_name}</p>
                      {isAlert && (
                        <AlertTriangle className={`h-3 w-3 flex-shrink-0 ${isActive ? "text-yellow-300" : "text-amber-500"}`} />
                      )}
                    </div>
                    <p className={`text-[10px] truncate ${isActive ? "text-purple-200" : "text-purple-400"}`}>
                      {entriesByPatient.get(p.id)?.length ?? 0} entries · last{" "}
                      {latest ? new Date(latest.entry_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                    </p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 opacity-50 ${isActive ? "text-white" : "text-purple-400"}`} />
                </button>
              );
            })
          )}
        </div>

        {/* RIGHT: Detail panel */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {!selected ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 bg-white/50 rounded-2xl border border-purple-100 backdrop-blur-sm p-10">
              <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                <User className="h-8 w-8 text-[#6B4C93]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3b2055]">Select a patient</p>
                <p className="text-xs text-purple-400 mt-1">Choose a patient from the left panel to view their complete wellness history and insights.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Patient header card */}
              <div className="bg-white/70 backdrop-blur-sm border border-purple-100 rounded-2xl p-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center text-white font-bold text-xl shadow">
                    {selectedPatient?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#3b2055]">{selectedPatient?.full_name}</h3>
                    <p className="text-xs text-purple-400">
                      {selectedEntries.length} wellness entries · Last 30 days
                    </p>
                  </div>
                </div>

                {/* Clinical alert banners */}
                <div className="flex gap-2 flex-wrap">
                  {(selectedEntries[0]?.metrics.mood ?? 5) <= 3 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5" /> Low Mood Alert
                    </span>
                  )}
                  {(selectedEntries[0]?.metrics.anxiety ?? 5) >= 8 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-600 px-3 py-1.5 rounded-lg">
                      <AlertCircle className="h-3.5 w-3.5 animate-pulse" /> High Anxiety Alert
                    </span>
                  )}
                  {(selectedEntries[0]?.metrics.mood ?? 5) > 3 && (selectedEntries[0]?.metrics.anxiety ?? 5) < 8 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-green-50 border border-green-200 text-green-600 px-3 py-1.5 rounded-lg">
                      <Shield className="h-3.5 w-3.5" /> Clinically Stable
                    </span>
                  )}
                </div>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {[
                  {
                    label: "Avg Mood",
                    value: avg(stats.moods),
                    unit: "/ 10",
                    icon: "😊",
                    sparkValues: stats.moods,
                    color: "bg-purple-400",
                    t: trend(stats.moods),
                    good: "up",
                  },
                  {
                    label: "Avg Anxiety",
                    value: avg(stats.anxieties),
                    unit: "/ 10",
                    icon: "💭",
                    sparkValues: stats.anxieties,
                    color: "bg-orange-400",
                    t: trend(stats.anxieties),
                    good: "down",
                  },
                  {
                    label: "Avg Sleep",
                    value: avg(stats.sleeps),
                    unit: "hrs",
                    icon: "🌙",
                    sparkValues: stats.sleeps,
                    color: "bg-sky-400",
                    t: trend(stats.sleeps),
                    good: "up",
                  },
                  {
                    label: "Screen Time",
                    value: avg(stats.screens),
                    unit: "hrs",
                    icon: "📱",
                    sparkValues: stats.screens,
                    color: "bg-violet-400",
                    t: trend(stats.screens),
                    good: "down",
                  },
                  {
                    label: "Water Intake",
                    value: avg(stats.waters),
                    unit: "cups",
                    icon: "💧",
                    sparkValues: stats.waters,
                    color: "bg-blue-400",
                    t: trend(stats.waters),
                    good: "up",
                  },
                ].map((stat) => {
                  const trendColor =
                    stat.t === "flat" ? "text-gray-400"
                    : stat.t === stat.good ? "text-emerald-500"
                    : "text-red-500";
                  const TrendIcon =
                    stat.t === "up"   ? TrendingUp
                    : stat.t === "down" ? TrendingDown
                    : Minus;

                  return (
                    <div key={stat.label} className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">{stat.label}</span>
                        <span className="text-base">{stat.icon}</span>
                      </div>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold text-[#3b2055]">{stat.value ?? "—"}</span>
                        {stat.value !== null && <span className="text-xs text-purple-400 mb-0.5">{stat.unit}</span>}
                      </div>
                      <Sparkline values={stat.sparkValues} color={stat.color} />
                      <div className={`flex items-center gap-1 text-[10px] font-medium ${trendColor}`}>
                        <TrendIcon className="h-3 w-3" />
                        {stat.t === "up" ? "Trending up" : stat.t === "down" ? "Trending down" : "Stable"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Entry history */}
              <div>
                <h4 className="text-sm font-bold text-[#3b2055] mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6B4C93]" />
                  Wellness Log History ({selectedEntries.length} entries)
                </h4>

                <div className="flex flex-col gap-3">
                  {selectedEntries.map((e, i) => {
                    const mS = moodState(e.metrics.mood ?? 5);
                    const aS = anxietyState(e.metrics.anxiety ?? 5);
                    const isCritical = (e.metrics.mood ?? 5) <= 3 || (e.metrics.anxiety ?? 5) >= 8;

                    return (
                      <div
                        key={e.id ?? i}
                        className={`bg-white/80 backdrop-blur-sm border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                          isCritical ? "border-red-200" : "border-purple-100"
                        }`}
                      >
                        {/* date + critical flag */}
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6B4C93]">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(e.entry_date).toLocaleDateString(undefined, {
                              weekday: "long", day: "numeric", month: "long", year: "numeric"
                            })}
                          </span>
                          {isCritical && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              <AlertTriangle className="h-3 w-3" /> Needs attention
                            </span>
                          )}
                        </div>

                        {/* Metric grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          {/* Mood */}
                          <div className={`rounded-xl border px-3 py-2.5 ${mS.pill}`}>
                            <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Mood</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{mS.emoji}</span>
                              <div>
                                <div className="text-sm font-bold leading-none">{e.metrics.mood ?? "—"}<span className="text-[10px] font-normal opacity-60">/10</span></div>
                                <div className="text-[10px] font-medium">{mS.label}</div>
                              </div>
                            </div>
                            <div className="mt-2 w-full bg-black/10 rounded-full h-1">
                              <div className={`h-1 rounded-full ${mS.bar}`} style={{ width: `${(e.metrics.mood ?? 5) * 10}%` }} />
                            </div>
                          </div>

                          {/* Anxiety */}
                          <div className={`rounded-xl border px-3 py-2.5 ${aS.pill}`}>
                            <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Anxiety</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{aS.emoji}</span>
                              <div>
                                <div className="text-sm font-bold leading-none">{e.metrics.anxiety ?? "—"}<span className="text-[10px] font-normal opacity-60">/10</span></div>
                                <div className="text-[10px] font-medium">{aS.label}</div>
                              </div>
                            </div>
                            <div className="mt-2 w-full bg-black/10 rounded-full h-1">
                              <div className={`h-1 rounded-full ${aS.bar}`} style={{ width: `${(e.metrics.anxiety ?? 5) * 10}%` }} />
                            </div>
                          </div>

                          {/* Sleep */}
                          {e.metrics.sleep_hours !== undefined && (
                            <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-700 px-3 py-2.5">
                              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Sleep</div>
                              <div className="flex items-center gap-1.5">
                                <Coffee className="h-4 w-4" />
                                <span className="text-sm font-bold">{e.metrics.sleep_hours}<span className="text-[10px] font-normal opacity-60"> hrs</span></span>
                              </div>
                              <div className="mt-2 w-full bg-sky-200/50 rounded-full h-1">
                                <div className="h-1 rounded-full bg-sky-400" style={{ width: `${Math.min((e.metrics.sleep_hours / 12) * 100, 100)}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Screen time */}
                          {e.metrics.screen_time !== undefined && (
                            <div className="rounded-xl border border-violet-200 bg-violet-50 text-violet-700 px-3 py-2.5">
                              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Screen Time</div>
                              <div className="flex items-center gap-1.5">
                                <Monitor className="h-4 w-4" />
                                <span className="text-sm font-bold">{e.metrics.screen_time}<span className="text-[10px] font-normal opacity-60"> hrs</span></span>
                              </div>
                              <div className="mt-2 w-full bg-violet-200/50 rounded-full h-1">
                                <div className="h-1 rounded-full bg-violet-400" style={{ width: `${Math.min((e.metrics.screen_time / 16) * 100, 100)}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Water */}
                          {e.metrics.water_intake !== undefined && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2.5">
                              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Water Intake</div>
                              <div className="flex items-center gap-1.5">
                                <Droplets className="h-4 w-4" />
                                <span className="text-sm font-bold">{e.metrics.water_intake}<span className="text-[10px] font-normal opacity-60"> cups</span></span>
                              </div>
                              <div className="mt-2 w-full bg-blue-200/50 rounded-full h-1">
                                <div className="h-1 rounded-full bg-blue-400" style={{ width: `${Math.min((e.metrics.water_intake / 12) * 100, 100)}%` }} />
                              </div>
                            </div>
                          )}

                          {/* Food */}
                          {e.metrics.food_intake && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2.5">
                              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-1">Food Intake</div>
                              <div className="flex items-center gap-1.5">
                                <Utensils className="h-4 w-4" />
                                <span className="text-xs font-semibold">{foodLabel(e.metrics.food_intake)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reflection */}
                        {e.reflection ? (
                          <div className="text-xs italic text-[#6B4C93] border-l-2 border-purple-300 pl-3 py-1 bg-purple-50/50 rounded-r-lg">
                            "{e.reflection}"
                          </div>
                        ) : (
                          <p className="text-xs text-purple-300 italic">No reflection recorded for this day.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
