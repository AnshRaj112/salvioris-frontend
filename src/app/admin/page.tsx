"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Shield, CheckCircle, XCircle, Eye, Download, User, Mail, Phone, GraduationCap, Award, FileText, Ban, Unlock, AlertTriangle, MessageSquare, Contact, Users, UserCheck, Lock, LogOut, Trash2 } from "lucide-react";
import styles from "./Admin.module.scss";

interface Therapist {
  id: string;
  name: string;
  email: string;
  created_at: string;
  license_number: string;
  license_state: string;
  years_of_experience: number;
  specialization?: string;
  phone: string;
  college_degree: string;
  masters_institution: string;
  psychologist_type: string;
  successful_cases: number;
  dsm_awareness: string;
  therapy_types: string;
  certificate_image_path: string;
  degree_image_path: string;
  is_approved: boolean;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

interface Feedback {
  id: string;
  feedback: string;
  created_at: string;
  ip_address?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  ip_address?: string;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  ip_address?: string;
}

import { api } from "../lib/api";

export default function AdminDashboard() {
  const [pendingTherapists, setPendingTherapists] = useState<Therapist[]>([]);
  const [approvedTherapists, setApprovedTherapists] = useState<Therapist[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [userWaitlist, setUserWaitlist] = useState<WaitlistEntry[]>([]);
  const [therapistWaitlist, setTherapistWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIPs, setIsLoadingIPs] = useState(false);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingUserWaitlist, setIsLoadingUserWaitlist] = useState(false);
  const [isLoadingTherapistWaitlist, setIsLoadingTherapistWaitlist] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "blocked" | "feedback" | "contact" | "userWaitlist" | "therapistWaitlist">("pending");
  const [isSiteLocked, setIsSiteLocked] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [deletingWaitlistId, setDeletingWaitlistId] = useState<string | null>(null);

  // Check authentication first, before anything else
  useEffect(() => {
    if (typeof window !== "undefined") {
      const admin = localStorage.getItem("admin");
      const token = localStorage.getItem("admin_token");
      if (!admin || !token) {
        // Redirect immediately if not authenticated
        window.location.replace("/admin-login");
        return;
      }
      // Admin is authenticated
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
      
      // Check site lock status
      const unlocked = localStorage.getItem("site_unlocked") === "true";
      setIsSiteLocked(!unlocked);
    }
  }, []);

  useEffect(() => {
    // Only fetch data if authenticated
    if (!isAuthenticated) {
      return;
    }
    
    fetchTherapists();
    if (activeTab === "blocked") {
      fetchBlockedIPs();
    } else if (activeTab === "feedback") {
      fetchFeedbacks();
    } else if (activeTab === "contact") {
      fetchContacts();
    } else if (activeTab === "userWaitlist") {
      fetchUserWaitlist();
    } else if (activeTab === "therapistWaitlist") {
      fetchTherapistWaitlist();
    }
  }, [activeTab, isAuthenticated]);

  const handleToggleSiteLock = () => {
    const newLockState = !isSiteLocked;
    setIsSiteLocked(newLockState);
    localStorage.setItem("site_unlocked", newLockState ? "false" : "true");
    // Reload to apply changes
    window.location.reload();
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_token");
      window.location.href = "/admin-login";
    }
  };

  const fetchTherapists = async () => {
    setIsLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        api.getPendingTherapists(),
        api.getApprovedTherapists(),
      ]);

      if (pendingData.success) {
        setPendingTherapists(pendingData.therapists || []);
      }
      if (approvedData.success) {
        setApprovedTherapists(approvedData.therapists || []);
      }
    } catch (error) {
      console.error("Error fetching therapists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedIPs = async () => {
    setIsLoadingIPs(true);
    try {
      const data = await api.getBlockedIPs();
      if (data.success) {
        setBlockedIPs(data.blocked_ips || []);
      }
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
      alert("Failed to fetch blocked IPs");
    } finally {
      setIsLoadingIPs(false);
    }
  };

  const fetchFeedbacks = async () => {
    setIsLoadingFeedbacks(true);
    try {
      const data = await api.getFeedbacks();
      if (data.success) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      alert("Failed to fetch feedbacks");
    } finally {
      setIsLoadingFeedbacks(false);
    }
  };

  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      const data = await api.getContacts();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      alert("Failed to fetch contacts");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchUserWaitlist = async () => {
    setIsLoadingUserWaitlist(true);
    try {
      const data = await api.getUserWaitlist();
      if (data.success) {
        setUserWaitlist(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching user waitlist:", error);
      alert("Failed to fetch user waitlist");
    } finally {
      setIsLoadingUserWaitlist(false);
    }
  };

  const fetchTherapistWaitlist = async () => {
    setIsLoadingTherapistWaitlist(true);
    try {
      const data = await api.getTherapistWaitlist();
      if (data.success) {
        setTherapistWaitlist(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching therapist waitlist:", error);
      alert("Failed to fetch therapist waitlist");
    } finally {
      setIsLoadingTherapistWaitlist(false);
    }
  };

  const handleUnblock = async (ipAddress: string) => {
    if (!confirm(`Are you sure you want to unblock IP address ${ipAddress}?`)) return;

    try {
      const data = await api.unblockIP(ipAddress);
      if (data.success) {
        alert(`IP address ${ipAddress} has been unblocked successfully`);
        fetchBlockedIPs();
      } else {
        alert("Failed to unblock IP address");
      }
    } catch (error) {
      console.error("Error unblocking IP:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to unblock IP address";
      alert(errorMessage);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this therapist?")) return;

    try {
      const data = await api.approveTherapist(id);
      if (data.success) {
        alert("Therapist approved successfully!");
        fetchTherapists();
        setSelectedTherapist(null);
      } else {
        alert("Failed to approve therapist");
      }
    } catch (error) {
      console.error("Error approving therapist:", error);
      alert("Failed to approve therapist");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this therapist application? This action cannot be undone.")) return;

    try {
      const data = await api.rejectTherapist(id);
      if (data.success) {
        alert("Therapist application rejected");
        fetchTherapists();
        setSelectedTherapist(null);
      } else {
        alert("Failed to reject therapist");
      }
    } catch (error) {
      console.error("Error rejecting therapist:", error);
      alert("Failed to reject therapist");
    }
  };

  const handleDeleteUserWaitlistEntry = async (id: string) => {
    if (!confirm("Delete this user waitlist entry? This action cannot be undone.")) return;
    setDeletingWaitlistId(id);
    try {
      const data = await api.deleteUserWaitlistEntry(id);
      if (data.success) {
        alert("Waitlist entry deleted");
        fetchUserWaitlist();
      } else {
        alert(data.message || "Failed to delete waitlist entry");
      }
    } catch (error) {
      console.error("Error deleting user waitlist entry:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete waitlist entry";
      alert(errorMessage);
    } finally {
      setDeletingWaitlistId(null);
    }
  };

  const handleDeleteTherapistWaitlistEntry = async (id: string) => {
    if (!confirm("Delete this therapist waitlist entry? This action cannot be undone.")) return;
    setDeletingWaitlistId(id);
    try {
      const data = await api.deleteTherapistWaitlistEntry(id);
      if (data.success) {
        alert("Waitlist entry deleted");
        fetchTherapistWaitlist();
      } else {
        alert(data.message || "Failed to delete waitlist entry");
      }
    } catch (error) {
      console.error("Error deleting therapist waitlist entry:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete waitlist entry";
      alert(errorMessage);
    } finally {
      setDeletingWaitlistId(null);
    }
  };

  const therapists = activeTab === "pending" ? pendingTherapists : activeTab === "approved" ? approvedTherapists : [];

  // Show loading or nothing while checking authentication
  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.adminDashboard}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Shield className={styles.headerIcon} />
            <h1 className={styles.title}>Admin Dashboard</h1>
          </div>
          <div className={styles.headerRight}>
            <Button
              onClick={handleToggleSiteLock}
              variant={isSiteLocked ? "default" : "destructive"}
              className={styles.siteLockButton}
            >
              {isSiteLocked ? (
                <>
                  <Unlock className={styles.buttonIcon} />
                  Unlock Site
                </>
              ) : (
                <>
                  <Lock className={styles.buttonIcon} />
                  Lock Site
                </>
              )}
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className={styles.logoutButton}
            >
              <LogOut className={styles.buttonIcon} />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "pending" ? styles.active : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Applications ({pendingTherapists.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "approved" ? styles.active : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved Therapists ({approvedTherapists.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "blocked" ? styles.active : ""}`}
            onClick={() => setActiveTab("blocked")}
          >
            <Ban className={styles.tabIcon} />
            Blocked IPs ({blockedIPs.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "feedback" ? styles.active : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            <MessageSquare className={styles.tabIcon} />
            Feedback ({feedbacks.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "contact" ? styles.active : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            <Contact className={styles.tabIcon} />
            Contact Us ({contacts.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "userWaitlist" ? styles.active : ""}`}
            onClick={() => setActiveTab("userWaitlist")}
          >
            <Users className={styles.tabIcon} />
            User Waitlist ({userWaitlist.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "therapistWaitlist" ? styles.active : ""}`}
            onClick={() => setActiveTab("therapistWaitlist")}
          >
            <UserCheck className={styles.tabIcon} />
            Therapist Waitlist ({therapistWaitlist.length})
          </button>
        </div>

        {activeTab === "feedback" ? (
          isLoadingFeedbacks ? (
            <div className={styles.loading}>Loading feedbacks...</div>
          ) : feedbacks.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare className={styles.emptyIcon} />
              <p>No feedbacks found.</p>
            </div>
          ) : (
            <div className={styles.feedbacksGrid}>
              {feedbacks.map((feedback) => (
                <Card key={feedback.id} className={styles.feedbackCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <MessageSquare className={styles.icon} />
                      Feedback #{feedback.id.slice(-6)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.feedbackText}>
                        {feedback.feedback}
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Submitted:</span>
                        <span>{new Date(feedback.created_at).toLocaleString()}</span>
                      </div>
                      {feedback.ip_address && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IP Address:</span>
                          <span>{feedback.ip_address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "contact" ? (
          isLoadingContacts ? (
            <div className={styles.loading}>Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <Contact className={styles.emptyIcon} />
              <p>No contact submissions found.</p>
            </div>
          ) : (
            <div className={styles.feedbacksGrid}>
              {contacts.map((contact) => (
                <Card key={contact.id} className={styles.feedbackCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <Contact className={styles.icon} />
                      Contact #{contact.id.slice(-6)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.infoItem}>
                        <User className={styles.infoIcon} />
                        <span><strong>Name:</strong> {contact.name}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Mail className={styles.infoIcon} />
                        <span><strong>Email:</strong> {contact.email}</span>
                      </div>
                      <div className={styles.feedbackText}>
                        <strong>Message:</strong>
                        <p>{contact.message}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Submitted:</span>
                        <span>{new Date(contact.created_at).toLocaleString()}</span>
                      </div>
                      {contact.ip_address && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IP Address:</span>
                          <span>{contact.ip_address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "userWaitlist" ? (
          isLoadingUserWaitlist ? (
            <div className={styles.loading}>Loading user waitlist...</div>
          ) : userWaitlist.length === 0 ? (
            <div className={styles.emptyState}>
              <Users className={styles.emptyIcon} />
              <p>No user waitlist entries found.</p>
            </div>
          ) : (
            <div className={styles.feedbacksGrid}>
              {userWaitlist.map((entry) => (
                <Card key={entry.id} className={styles.feedbackCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <Users className={styles.icon} />
                      User Waitlist #{entry.id.slice(-6)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.infoItem}>
                        <User className={styles.infoIcon} />
                        <span><strong>Name:</strong> {entry.name}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Mail className={styles.infoIcon} />
                        <span><strong>Email:</strong> {entry.email}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Joined:</span>
                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      {entry.ip_address && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IP Address:</span>
                          <span>{entry.ip_address}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteUserWaitlistEntry(entry.id)}
                        disabled={deletingWaitlistId === entry.id}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        {deletingWaitlistId === entry.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "therapistWaitlist" ? (
          isLoadingTherapistWaitlist ? (
            <div className={styles.loading}>Loading therapist waitlist...</div>
          ) : therapistWaitlist.length === 0 ? (
            <div className={styles.emptyState}>
              <UserCheck className={styles.emptyIcon} />
              <p>No therapist waitlist entries found.</p>
            </div>
          ) : (
            <div className={styles.feedbacksGrid}>
              {therapistWaitlist.map((entry) => (
                <Card key={entry.id} className={styles.feedbackCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <UserCheck className={styles.icon} />
                      Therapist Waitlist #{entry.id.slice(-6)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.infoItem}>
                        <User className={styles.infoIcon} />
                        <span><strong>Name:</strong> {entry.name}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <Mail className={styles.infoIcon} />
                        <span><strong>Email:</strong> {entry.email}</span>
                      </div>
                      {entry.phone && (
                        <div className={styles.infoItem}>
                          <Phone className={styles.infoIcon} />
                          <span><strong>Phone:</strong> {entry.phone}</span>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Joined:</span>
                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      {entry.ip_address && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IP Address:</span>
                          <span>{entry.ip_address}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTherapistWaitlistEntry(entry.id)}
                        disabled={deletingWaitlistId === entry.id}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        {deletingWaitlistId === entry.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "blocked" ? (
          isLoadingIPs ? (
            <div className={styles.loading}>Loading blocked IPs...</div>
          ) : blockedIPs.length === 0 ? (
            <div className={styles.emptyState}>
              <Ban className={styles.emptyIcon} />
              <p>No blocked IP addresses found.</p>
            </div>
          ) : (
            <div className={styles.blockedIPsGrid}>
              {blockedIPs.map((blocked) => (
                <Card key={blocked.id} className={styles.blockedIPCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <Ban className={styles.icon} />
                      {blocked.ip_address}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.infoItem}>
                        <AlertTriangle className={styles.infoIcon} />
                        <span><strong>Reason:</strong> {blocked.reason}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Blocked At:</span>
                        <span>{new Date(blocked.created_at).toLocaleString()}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Expires At:</span>
                        <span>{new Date(blocked.expires_at).toLocaleString()}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Status:</span>
                        <span className={blocked.is_active ? styles.activeBadge : styles.inactiveBadge}>
                          {blocked.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="default"
                        onClick={() => handleUnblock(blocked.ip_address)}
                        className={styles.unblockButton}
                        disabled={!blocked.is_active}
                      >
                        <Unlock className={styles.buttonIcon} />
                        Unblock IP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : isLoading ? (
          <div className={styles.loading}>Loading therapists...</div>
        ) : therapists.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No {activeTab === "pending" ? "pending" : "approved"} therapists found.</p>
          </div>
        ) : (
          <div className={styles.therapistGrid}>
            {therapists.map((therapist) => (
              <Card key={therapist.id} className={styles.therapistCard}>
                <CardHeader>
                  <CardTitle className={styles.cardTitle}>
                    <User className={styles.icon} />
                    {therapist.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={styles.info}>
                    <div className={styles.infoItem}>
                      <Mail className={styles.infoIcon} />
                      <span>{therapist.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Phone className={styles.infoIcon} />
                      <span>{therapist.phone}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Award className={styles.infoIcon} />
                      <span>{therapist.license_number} ({therapist.license_state})</span>
                    </div>
                    <div className={styles.infoItem}>
                      <GraduationCap className={styles.infoIcon} />
                      <span>{therapist.college_degree}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Experience:</span>
                      <span>{therapist.years_of_experience} years</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Type:</span>
                      <span>{therapist.psychologist_type}</span>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedTherapist(therapist)}
                      className={styles.viewButton}
                    >
                      <Eye className={styles.buttonIcon} />
                      View Details
                    </Button>
                    {activeTab === "pending" && (
                      <>
                        <Button
                          variant="default"
                          onClick={() => handleApprove(therapist.id)}
                          className={styles.approveButton}
                        >
                          <CheckCircle className={styles.buttonIcon} />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(therapist.id)}
                          className={styles.rejectButton}
                        >
                          <XCircle className={styles.buttonIcon} />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedTherapist && (
        <div className={styles.modal} onClick={() => setSelectedTherapist(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Therapist Details</h2>
              <button className={styles.closeButton} onClick={() => setSelectedTherapist(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3>Personal Information</h3>
                <div className={styles.detailGrid}>
                  <div><strong>Name:</strong> {selectedTherapist.name}</div>
                  <div><strong>Email:</strong> {selectedTherapist.email}</div>
                  <div><strong>Phone:</strong> {selectedTherapist.phone}</div>
                  <div><strong>Applied:</strong> {new Date(selectedTherapist.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>License Information</h3>
                <div className={styles.detailGrid}>
                  <div><strong>License Number:</strong> {selectedTherapist.license_number}</div>
                  <div><strong>License State:</strong> {selectedTherapist.license_state}</div>
                  <div><strong>Years of Experience:</strong> {selectedTherapist.years_of_experience}</div>
                  <div><strong>Specialization:</strong> {selectedTherapist.specialization || "N/A"}</div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Education</h3>
                <div className={styles.detailGrid}>
                  <div><strong>College Degree:</strong> {selectedTherapist.college_degree}</div>
                  <div><strong>Master&apos;s Institution:</strong> {selectedTherapist.masters_institution}</div>
                  <div><strong>Psychologist Type:</strong> {selectedTherapist.psychologist_type}</div>
                  <div><strong>Successful Cases:</strong> {selectedTherapist.successful_cases}</div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Professional Details</h3>
                <div className={styles.detailItem}>
                  <strong>DSM Awareness:</strong>
                  <p>{selectedTherapist.dsm_awareness}</p>
                </div>
                <div className={styles.detailItem}>
                  <strong>Therapy Types:</strong>
                  <p>{selectedTherapist.therapy_types}</p>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Documents</h3>
                <div className={styles.documents}>
                  <div className={styles.document}>
                    <FileText className={styles.documentIcon} />
                    <strong>Certificate/License</strong>
                    {selectedTherapist.certificate_image_path ? (
                      <div className={styles.documentPreview}>
                        <img
                          src={selectedTherapist.certificate_image_path}
                          alt="Certificate"
                          className={styles.documentImage}
                        />
                        <a
                          href={selectedTherapist.certificate_image_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadLink}
                        >
                          <Download className={styles.downloadIcon} />
                          View Full Size
                        </a>
                      </div>
                    ) : (
                      <p className={styles.noDocument}>No certificate uploaded</p>
                    )}
                  </div>
                  <div className={styles.document}>
                    <FileText className={styles.documentIcon} />
                    <strong>College Degree</strong>
                    {selectedTherapist.degree_image_path ? (
                      <div className={styles.documentPreview}>
                        <img
                          src={selectedTherapist.degree_image_path}
                          alt="Degree"
                          className={styles.documentImage}
                        />
                        <a
                          href={selectedTherapist.degree_image_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadLink}
                        >
                          <Download className={styles.downloadIcon} />
                          View Full Size
                        </a>
                      </div>
                    ) : (
                      <p className={styles.noDocument}>No degree uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {!selectedTherapist.is_approved && (
                <div className={styles.modalActions}>
                  <Button
                    variant="default"
                    onClick={() => {
                      handleApprove(selectedTherapist.id);
                      setSelectedTherapist(null);
                    }}
                    className={styles.approveButton}
                  >
                    <CheckCircle className={styles.buttonIcon} />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleReject(selectedTherapist.id);
                      setSelectedTherapist(null);
                    }}
                    className={styles.rejectButton}
                  >
                    <XCircle className={styles.buttonIcon} />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

