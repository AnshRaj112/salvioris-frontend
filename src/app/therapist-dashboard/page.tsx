"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Plus, Users, Check, X, Bell, Search, Award, Shield, Activity, Calendar, Edit3, Settings } from "lucide-react";
import { api, ApiError, Therapist } from "../lib/api";
import styles from "./TherapistDashboard.module.scss";

interface ReferralCode {
  id: string;
  code: string;
  created_at: string;
  expires_at?: string;
  usage_limit?: number;
  usage_count: number;
  is_revoked: boolean;
}

interface ConnectedUser {
  user_id: string;
  username: string;
  connected_at: string;
  connection_type: string;
}

interface ConnectionRequest {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  note?: string;
}

interface ReferralAnalytics {
  total_codes: number;
  active_codes: number;
  total_signups: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function TherapistDashboard() {
  const router = useRouter();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "profile">("overview");

  // State registry
  const [referrals, setReferrals] = useState<ReferralCode[]>([]);
  const [analytics, setAnalytics] = useState<ReferralAnalytics>({ total_codes: 0, active_codes: 0, total_signups: 0 });
  const [connections, setConnections] = useState<ConnectedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modals & Forms
  const [showGenModal, setShowGenModal] = useState(false);
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Editor State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    specialization: "",
    phone: "",
    years_of_experience: 0,
    dsm_awareness: "",
    therapy_types: ""
  });

  // Global loading states
  // Loading state handled by isLoading return above

  useEffect(() => {
    // Authenticate therapist
    const storedTherapist = localStorage.getItem("therapist");
    if (!storedTherapist) {
      router.push("/therapist-signin");
      return;
    }
    
    try {
      const parsed = JSON.parse(storedTherapist) as Therapist;
      setTherapist(parsed);
      setProfileData({
        specialization: parsed.specialization || "",
        phone: parsed.phone || "",
        years_of_experience: parsed.years_of_experience || 0,
        dsm_awareness: parsed.dsm_awareness || "",
        therapy_types: parsed.therapy_types || ""
      });
      loadDashboardData();
    } catch {
      router.push("/therapist-signin");
    }
  }, [router]);

  const fetchDirectory = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.searchTherapists({
        specialization: undefined,
        location: undefined,
        availability: undefined,
        q: searchQuery || undefined,
      });

      if (res.success) {
        // Handle therapists state
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to load therapist directory.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Referral Codes list
      const refRes = await api.getReferralCodes();
      if (refRes.success) setReferrals(refRes.codes || []);

      // 2. Analytics aggregates
      const analyticsRes = await api.getReferralAnalytics();
      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);

      // 3. Active Patient Connections
      const connRes = await api.getConnectedUsers();
      if (connRes.success) setConnections(connRes.connections || []);

      // 4. Pending Direct Requests
      const reqRes = await api.getPendingConnectionRequests();
      if (reqRes.success) setRequests(reqRes.requests || []);

      // 5. In-App Notifications
      const notifRes = await api.getNotifications();
      if (notifRes.success) setNotifications(notifRes.notifications || []);
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCode(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload: { usage_limit?: number; expires_at?: string } = {};
      if (usageLimit) payload.usage_limit = parseInt(usageLimit);
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();

      const res = await api.generateReferralCode(payload);
      if (res.success) {
        setSuccessMsg(`Secure code SAL-${res.code || ""} generated!`);
        setUsageLimit("");
        setExpiresAt("");
        setShowGenModal(false);
        // Reload dashboard
        loadDashboardData();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to generate referral code.");
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleRevokeCode = async (codeID: string) => {
    if (!confirm("Are you sure you want to revoke this referral code? No further users will be allowed to link using it.")) {
      return;
    }
    setErrorMsg(null);
    try {
      const res = await api.revokeReferralCode(codeID);
      if (res.success) {
        setReferrals(prev => prev.map(c => c.id === codeID ? { ...c, is_revoked: true } : c));
        loadDashboardData();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to revoke code.");
    }
  };

  const handleRespondToRequest = async (requestID: string, approve: boolean) => {
    setErrorMsg(null);
    try {
      const res = await api.respondToConnectionRequest(requestID, approve);
      if (res.success) {
        setRequests(prev => prev.filter(r => r.id !== requestID));
        loadDashboardData();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to respond to connection request.");
    }
  };

  const handleDisconnectPatient = async (patientID: string) => {
    if (!confirm("Are you sure you want to disconnect this patient? This unlinks relationship bounds and revokes PHI reading consent.")) {
      return;
    }
    setErrorMsg(null);
    try {
      const res = await api.disconnectPatient(patientID);
      if (res.success) {
        setConnections(prev => prev.filter(c => c.user_id !== patientID));
        loadDashboardData();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to disconnect patient.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await api.updateTherapistProfile(profileData);
      if (res.success) {
        const updatedTherapist = { ...therapist, ...profileData } as Therapist;
        localStorage.setItem("therapist", JSON.stringify(updatedTherapist));
        setTherapist(updatedTherapist);
        setIsEditingProfile(false);
        setSuccessMsg("Professional profile parameters successfully committed!");
        loadDashboardData();
      }
    } catch (err) {
      const apiError = err as ApiError;
      setErrorMsg(apiError.message || "Failed to update professional profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notifID: string) => {
    try {
      await api.markNotificationRead(notifID);
      setNotifications(prev => prev.map(n => n.id === notifID ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("therapist");
    localStorage.removeItem("session_token");
    router.push("/therapist-signin");
  };

  if (!therapist) return null;

  const filteredConnections = connections.filter(cu => 
    cu.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.dashboardPage}>
      {/* Premium Header */}
      <header className={styles.header}>
        <div className={styles.brandWrapper}>
          <div className={styles.logoIcon}>
            <Shield className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h1 className={styles.brandName}>
              SALVIORIS <span className={styles.badge}>Therapist Core</span>
            </h1>
          </div>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.therapistName}>Dr. {therapist.name}</span>
          <button onClick={handleLogout} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Hero Stats Section */}
      <section className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Key className="h-6 w-6" />
          </div>
          <div>
            <p className={styles.statLabel}>Total Referral Codes</p>
            <h3 className={styles.statValue}>{analytics.total_codes}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className={styles.statLabel}>Active Safe Codes</p>
            <h3 className={styles.statValue}>{analytics.active_codes}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className={styles.statLabel}>Referral Registrants</p>
            <h3 className={styles.statValue}>{analytics.total_signups}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className={styles.statLabel}>Total Connections</p>
            <h3 className={styles.statValue}>{connections.length}</h3>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <main className={styles.mainContainer}>
        
        {/* Navigation Sidebar */}
        <aside className={styles.sidebar}>
          <button 
            onClick={() => setActiveTab("overview")}
            className={`${styles.navButton} ${activeTab === "overview" ? styles.active : ""}`}
          >
            <Key className="h-4 w-4" />
            Referrals & Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab("clients")}
            className={`${styles.navButton} ${activeTab === "clients" ? styles.active : ""}`}
          >
            <Users className="h-4 w-4" />
            Connected Clients
            {requests.length > 0 && (
              <span className={styles.navBadge}>
                {requests.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("profile")}
            className={`${styles.navButton} ${activeTab === "profile" ? styles.active : ""}`}
          >
            <Settings className="h-4 w-4" />
            Clinical Profile
          </button>

          {/* Compliance Card */}
          <div className={styles.complianceCard}>
            <h4 className={styles.complianceHeader}>
              <Shield className="h-3.5 w-3.5" /> Compliance Status
            </h4>
            <p className={styles.complianceText}>
              Active session encrypted via SHA-256 tokens. Profile connections enforce strict patient-consent boundary checks in line with HIPAA safeguard rules.
            </p>
          </div>
        </aside>

        {/* Dynamic Panel Workspace */}
        <section className={styles.workspace}>
          
          {errorMsg && (
            <div className="bg-red-150 border border-red-250 p-4 rounded-xl text-red-700 text-xs flex items-center gap-2 mb-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <XCircle className="h-5 w-5 text-red-500" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-150 border border-emerald-250 p-4 rounded-xl text-emerald-700 text-xs flex items-center gap-2 mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              {successMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW & REFERRAL MANAGEMENT */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Referral Code Safe</h2>
                  <p className={styles.sectionSubtitle}>Generate secure, unguessable patient referral pathways.</p>
                </div>
                <button 
                  onClick={() => setShowGenModal(true)}
                  className={styles.primaryButton}
                >
                  <Plus className="h-4 w-4" /> Generate New Code
                </button>
              </div>

              {/* Generating Modal */}
              {showGenModal && (
                <div className={styles.modal}>
                  <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                      <Key className="h-4 w-4" /> New Referral Code Configuration
                    </h3>
                    <button onClick={() => setShowGenModal(false)} className={styles.closeButton}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateCode} className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Usage Limit (Optional)</label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Leave blank for unlimited" 
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Expiration Date (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowGenModal(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmittingCode}
                        className={styles.primaryButton}
                      >
                        {isSubmittingCode ? "Generating..." : "Generate Code"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Referral Codes Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Cryptotoken</th>
                      <th className={styles.th}>Created</th>
                      <th className={styles.th}>Expiration</th>
                      <th className={styles.th}>Limits/Usage</th>
                      <th className={styles.th}>Status</th>
                      <th className={`${styles.th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`${styles.td} text-center`}>
                          No referral codes generated yet. Click &quot;Generate New Code&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      referrals.map((r) => {
                        const isExpired = r.expires_at ? new Date(r.expires_at).getTime() < Date.now() : false;
                        const isLimitReached = r.usage_limit ? r.usage_count >= r.usage_limit : false;
                        const active = !r.is_revoked && !isExpired && !isLimitReached;

                        return (
                          <tr key={r.id} className={styles.tr}>
                            <td className={`${styles.td} ${styles.codeCell}`}>{r.code}</td>
                            <td className={styles.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                            <td className={styles.td}>
                              {r.expires_at ? new Date(r.expires_at).toLocaleString() : &quot;Never&quot;}
                            </td>
                            <td className={styles.td}>
                              {r.usage_count} / {r.usage_limit ? r.usage_limit : &quot;&infin;&quot;}
                            </td>
                            <td className={styles.td}>
                              {r.is_revoked ? (
                                <span className={`${styles.badgeStatus} ${styles.revoked}`}>Revoked</span>
                              ) : isExpired ? (
                                <span className={`${styles.badgeStatus} ${styles.expired}`}>Expired</span>
                              ) : isLimitReached ? (
                                <span className={`${styles.badgeStatus} ${styles.revoked}`}>Limit Reached</span>
                              ) : (
                                <span className={`${styles.badgeStatus} ${styles.active}`}>Active</span>
                              )}
                            </td>
                            <td className={`${styles.td} text-right`}>
                              {active && (
                                <button 
                                  onClick={() => handleRevokeCode(r.id)}
                                  className={styles.actionLink}
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE CLIENT ROSTER & REQUESTS */}
          {activeTab === "clients" && (
            <div className="flex flex-col gap-6">
              
              {/* Connection Requests Segment */}
              {requests.length > 0 && (
                <div className={styles.requestsContainer}>
                  <h3 className="text-sm font-bold text-purple-750 flex items-center gap-1.5" style={{ color: '#6B4C93' }}>
                    <Calendar className="h-4.5 w-4.5" /> Pending Client Connection Requests ({requests.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {requests.map((r) => (
                      <div key={r.id} className={styles.requestCard}>
                        <div>
                          <h4 className="text-xs font-bold" style={{ color: '#3b2055' }}>Client: {r.username}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Submitted {new Date(r.created_at).toLocaleString()}</p>
                          {r.note && (
                            <div className={styles.requestNote}>
                              {r.note}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleRespondToRequest(r.id, false)}
                            className={styles.rejectButton}
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                          <button 
                            onClick={() => handleRespondToRequest(r.id, true)}
                            className={styles.approveButton}
                          >
                            <Check className="h-4 w-4" /> Approve & Connect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clients Directory */}
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Connected Clients</h2>
                  <p className={styles.sectionSubtitle}>View and manage clinical relationships currently linked to your profile.</p>
                </div>
                
                <div className={styles.searchBarWrapper}>
                  <Search className={`${styles.searchIcon} h-4 w-4`} />
                  <input 
                    type="text" 
                    placeholder="Search clients..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>

              {/* Roster Grid */}
              <div className={styles.rosterGrid}>
                {filteredConnections.length === 0 ? (
                  <div className="md:col-span-2 p-8 text-center text-slate-500 bg-white border border-purple-100 rounded-2xl" style={{ border: '1px solid rgba(107, 76, 147, 0.12)' }}>
                    No active clients match the search parameters.
                  </div>
                ) : (
                  filteredConnections.map((c) => (
                    <div key={c.user_id} className={styles.rosterCard}>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold" style={{ color: '#3b2055' }}>{c.username}</h4>
                          <span className={`${styles.rosterTypeBadge} ${c.connection_type === "referral" ? styles.referral : styles.request}`}>
                            {c.connection_type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Linked on {new Date(c.connected_at).toLocaleDateString()}</p>
                      </div>
                      
                      <button 
                        onClick={() => handleDisconnectPatient(c.user_id)}
                        className={styles.actionLink}
                      >
                        Disconnect
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE MANAGEMENT */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6">
              <div className="border-b border-slate-200 pb-4" style={{ borderBottomColor: 'rgba(107, 76, 147, 0.1)' }}>
                <h2 className={styles.sectionTitle}>Clinical Profile Setup</h2>
                <p className={styles.sectionSubtitle}>Establish specialized parameters visible in user search directories.</p>
              </div>

              <form onSubmit={handleSaveProfile} className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Specialization</label>
                  <input 
                    type="text" 
                    value={profileData.specialization}
                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                    disabled={!isEditingProfile}
                    placeholder="e.g. Cognitive Behavioral Therapy, Anxiety, Trauma"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>License Contact Phone</label>
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditingProfile}
                    placeholder="e.g. +1 555-019-2834"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Years Of Experience</label>
                  <input 
                    type="number" 
                    value={profileData.years_of_experience}
                    onChange={(e) => setProfileData({ ...profileData, years_of_experience: parseInt(e.target.value) || 0 })}
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>DSM-5 Diagnostic Awareness</label>
                  <select 
                    value={profileData.dsm_awareness}
                    onChange={(e) => setProfileData({ ...profileData, dsm_awareness: e.target.value })}
                    disabled={!isEditingProfile}
                    className={styles.formInput}
                  >
                    <option value="">Select Awareness Level</option>
                    <option value="expert">Expert (Extensive diagnostic practice)</option>
                    <option value="proficient">Proficient (Standard treatment alignment)</option>
                    <option value="basic">Basic (Familiarity only)</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className={styles.formLabel}>Therapy Focus Areas (Comma separated)</label>
                  <textarea 
                    rows={3}
                    value={profileData.therapy_types}
                    onChange={(e) => setProfileData({ ...profileData, therapy_types: e.target.value })}
                    disabled={!isEditingProfile}
                    placeholder="e.g. Cognitive Behavioral Therapy (CBT), Dialectical Behavior Therapy (DBT), EMDR"
                    className={styles.formInput}
                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-purple-100 pt-4" style={{ borderTopColor: 'rgba(107, 76, 147, 0.1)' }}>
                  {isEditingProfile ? (
                    <>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileData({
                            specialization: therapist.specialization || "",
                            phone: therapist.phone || "",
                            years_of_experience: therapist.years_of_experience || 0,
                            dsm_awareness: therapist.dsm_awareness || "",
                            therapy_types: therapist.therapy_types || ""
                          });
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className={styles.primaryButton}
                      >
                        <Save className="h-4 w-4" /> Save Professional Changes
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className={styles.primaryButton}
                      style={{ background: '#fff', color: '#6B4C93', border: '1px solid rgba(107, 76, 147, 0.3)' }}
                    >
                      <Edit3 className="h-4 w-4" /> Edit Professional Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

        </section>

        {/* Real-time Notifications Drawer */}
        <aside className={styles.alertsDrawer}>
          <div className={styles.alertsCard}>
            <h3 className={styles.alertsTitle}>
              <Bell className="h-4 w-4" /> Clinic Alerts
            </h3>
            
            <div className={styles.alertList}>
              {notifications.length === 0 ? (
                <div className="text-center p-6 text-xs text-purple-300" style={{ color: 'rgba(107, 76, 147, 0.6)' }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => !n.is_read && handleMarkNotificationRead(n.id)}
                    className={`${styles.alertItem} ${n.is_read ? styles.read : styles.unread}`}
                  >
                    <div className={styles.alertHeader}>
                      <h4 className="text-[11px] font-bold">{n.title}</h4>
                      {!n.is_read && <span className={styles.alertDot}></span>}
                    </div>
                    <p className="text-[10px] mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[9px] block mt-1.5" style={{ opacity: 0.6 }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}
