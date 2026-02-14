"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Shield, CheckCircle, XCircle, Eye, Download, User, Mail, Phone, GraduationCap, Award, FileText, Ban, Unlock, AlertTriangle, MessageSquare, Contact, Users, UserCheck, LogOut, Trash2, MessageCircle, BarChart3, TrendingUp, Repeat, LayoutGrid } from "lucide-react";
import styles from "./Admin.module.scss";
import { ModalDialog } from "../components/ui/ModalDialog";

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

interface AdminUser {
  id: string;
  username: string;
  created_at: string;
  is_active: boolean;
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  ip_address?: string;
}

interface AdminGroup {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  created_at: string;
  member_count: number;
  created_by: string;
  tags?: string[];
}

interface AdminGroupMember {
  user_id: string;
  username: string;
  joined_at: string;
}

import { api } from "../lib/api";
import { formatDateTime } from "../lib/time";

export default function AdminDashboard() {
  const [pendingTherapists, setPendingTherapists] = useState<Therapist[]>([]);
  const [approvedTherapists, setApprovedTherapists] = useState<Therapist[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userWaitlist, setUserWaitlist] = useState<WaitlistEntry[]>([]);
  const [therapistWaitlist, setTherapistWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIPs, setIsLoadingIPs] = useState(false);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingUserWaitlist, setIsLoadingUserWaitlist] = useState(false);
  const [isLoadingTherapistWaitlist, setIsLoadingTherapistWaitlist] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "blocked" | "users" | "feedback" | "contact" | "userWaitlist" | "therapistWaitlist" | "groups" | "insights">("pending");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [deletingWaitlistId, setDeletingWaitlistId] = useState<string | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [adminGroups, setAdminGroups] = useState<AdminGroup[]>([]);
  const [adminGroupsLoading, setAdminGroupsLoading] = useState(false);
  const [adminGroupMembers, setAdminGroupMembers] = useState<AdminGroupMember[]>([]);
  const [adminGroupMembersLoading, setAdminGroupMembersLoading] = useState(false);
  const [membersModalGroup, setMembersModalGroup] = useState<AdminGroup | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [insights, setInsights] = useState<{
    from: string;
    to: string;
    new_users_per_day: { date: string; count: number }[];
    active_users_per_day: { date: string; count: number }[];
    recurring_users_count: number;
    top_pages: { path: string; count: number }[];
    total_new_users: number;
    total_active_users: number;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsFrom, setInsightsFrom] = useState("");
  const [insightsTo, setInsightsTo] = useState("");
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: "default" | "destructive";
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
  });
  const [isConfirmBusy, setIsConfirmBusy] = useState(false);

  // If any admin API returns 401, clear session and redirect to login
  const handleAdminApiError = (error: unknown, fallbackMessage: string) => {
    const err = error as { message?: string; status?: number };
    if (err?.status === 401) {
      localStorage.removeItem("admin");
      localStorage.removeItem("admin_token");
      window.location.replace("/admin-login");
      return;
    }
    setNotice({ title: "Error", message: err?.message || fallbackMessage });
  };

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
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "userWaitlist") {
      fetchUserWaitlist();
    } else if (activeTab === "therapistWaitlist") {
      fetchTherapistWaitlist();
    } else if (activeTab === "groups") {
      fetchAdminGroups();
    } else if (activeTab === "insights") {
      fetchInsights();
    }
  }, [activeTab, isAuthenticated]);

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      let from = insightsFrom;
      let to = insightsTo;
      if (!from || !to) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        from = start.toISOString().slice(0, 10);
        to = end.toISOString().slice(0, 10);
        setInsightsFrom(from);
        setInsightsTo(to);
      }
      const data = await api.getAdminInsights(from, to);
      if (data.success) {
        setInsights({
          from: data.from,
          to: data.to,
          new_users_per_day: data.new_users_per_day || [],
          active_users_per_day: data.active_users_per_day || [],
          recurring_users_count: data.recurring_users_count ?? 0,
          top_pages: data.top_pages || [],
          total_new_users: data.total_new_users ?? 0,
          total_active_users: data.total_active_users ?? 0,
        });
      }
    } catch (e) {
      handleAdminApiError(e, "Failed to load insights. Check network and admin auth.");
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleLogout = () => {
    setConfirmState({
      open: true,
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      confirmVariant: "destructive",
      onConfirm: () => {
        localStorage.removeItem("admin");
        localStorage.removeItem("admin_token");
        window.location.href = "/admin-login";
      },
    });
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
      handleAdminApiError(error, "Failed to fetch therapists.");
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
      handleAdminApiError(error, "Failed to fetch blocked IPs.");
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
      handleAdminApiError(error, "Failed to fetch feedbacks.");
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
      handleAdminApiError(error, "Failed to fetch contacts.");
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await api.getUsers();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      handleAdminApiError(error, "Failed to fetch users.");
    } finally {
      setIsLoadingUsers(false);
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
      handleAdminApiError(error, "Failed to fetch user waitlist.");
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
      handleAdminApiError(error, "Failed to fetch therapist waitlist.");
    } finally {
      setIsLoadingTherapistWaitlist(false);
    }
  };

  const fetchAdminGroups = async () => {
    setAdminGroupsLoading(true);
    try {
      const data = await api.getAdminGroups(100, 0);
      if (data.success && Array.isArray(data.groups)) {
        setAdminGroups(data.groups);
      } else {
        setAdminGroups([]);
      }
    } catch (error) {
      handleAdminApiError(error, "Failed to fetch community groups.");
      setAdminGroups([]);
    } finally {
      setAdminGroupsLoading(false);
    }
  };

  const openGroupMembers = async (group: AdminGroup) => {
    setMembersModalGroup(group);
    setAdminGroupMembers([]);
    setAdminGroupMembersLoading(true);
    try {
      const data = await api.getAdminGroupMembers(group.id);
      if (data.success && Array.isArray(data.members)) {
        setAdminGroupMembers(data.members);
      }
    } catch (error) {
      handleAdminApiError(error, "Failed to load members.");
    } finally {
      setAdminGroupMembersLoading(false);
    }
  };

  const handleDeleteAdminGroup = async (group: AdminGroup) => {
    setConfirmState({
      open: true,
      title: "Delete group",
      message: `Delete group "${group.name}"? This will remove the group and all its members. This action cannot be undone.`,
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingGroupId(group.id);
        try {
          const data = await api.deleteAdminGroup(group.id);
          if (data.success) {
            setNotice({ title: "Deleted", message: "Group deleted successfully." });
            fetchAdminGroups();
            setMembersModalGroup((prev) => (prev?.id === group.id ? null : prev));
          } else {
            setNotice({ title: "Error", message: data.message || "Failed to delete group." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to delete group.");
        } finally {
          setDeletingGroupId(null);
        }
      },
    });
  };

  const handleUnblock = async (ipAddress: string) => {
    setConfirmState({
      open: true,
      title: "Unblock IP",
      message: `Are you sure you want to unblock IP address ${ipAddress}?`,
      confirmText: "Unblock",
      confirmVariant: "default",
      onConfirm: async () => {
        try {
          const data = await api.unblockIP(ipAddress);
          if (data.success) {
            setNotice({ title: "Success", message: `IP address ${ipAddress} has been unblocked.` });
            fetchBlockedIPs();
          } else {
            setNotice({ title: "Error", message: "Failed to unblock IP address." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to unblock IP address.");
        }
      },
    });
  };

  const handleApprove = async (id: string) => {
    setConfirmState({
      open: true,
      title: "Approve therapist",
      message: "Are you sure you want to approve this therapist?",
      confirmText: "Approve",
      confirmVariant: "default",
      onConfirm: async () => {
        try {
          const data = await api.approveTherapist(id);
          if (data.success) {
            setNotice({ title: "Success", message: "Therapist approved successfully." });
            fetchTherapists();
            setSelectedTherapist(null);
          } else {
            setNotice({ title: "Error", message: "Failed to approve therapist." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to approve therapist.");
        }
      },
    });
  };

  const handleReject = async (id: string) => {
    setConfirmState({
      open: true,
      title: "Reject therapist",
      message: "Are you sure you want to reject this therapist application? This action cannot be undone.",
      confirmText: "Reject",
      confirmVariant: "destructive",
      onConfirm: async () => {
        try {
          const data = await api.rejectTherapist(id);
          if (data.success) {
            setNotice({ title: "Done", message: "Therapist application rejected and removed." });
            fetchTherapists();
            setSelectedTherapist(null);
          } else {
            setNotice({ title: "Error", message: "Failed to reject therapist." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to reject therapist.");
        }
      },
    });
  };

  const handleDeleteFeedback = async (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete feedback",
      message: "Delete this feedback? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingFeedbackId(id);
        try {
          const data = await api.deleteFeedback(id);
          if (data.success) {
            setNotice({ title: "Deleted", message: "Feedback deleted." });
            fetchFeedbacks();
          } else {
            setNotice({ title: "Error", message: data.message || "Failed to delete feedback." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to delete feedback.");
        } finally {
          setDeletingFeedbackId(null);
        }
      },
    });
  };

  const handleDeleteContact = async (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete contact",
      message: "Delete this contact submission? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingContactId(id);
        try {
          const data = await api.deleteContact(id);
          if (data.success) {
            setNotice({ title: "Deleted", message: "Contact deleted." });
            fetchContacts();
          } else {
            setNotice({ title: "Error", message: data.message || "Failed to delete contact." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to delete contact.");
        } finally {
          setDeletingContactId(null);
        }
      },
    });
  };

  const handleDeleteUser = async (id: string, username: string) => {
    setConfirmState({
      open: true,
      title: "Delete user",
      message: `Delete user "${username}"? This will remove the account and related data. This action cannot be undone.`,
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingUserId(id);
        try {
          const data = await api.deleteUser(id);
          if (data.success) {
            setNotice({ title: "Deleted", message: "User deleted." });
            fetchUsers();
          } else {
            setNotice({ title: "Error", message: data.message || "Failed to delete user." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to delete user.");
        } finally {
          setDeletingUserId(null);
        }
      },
    });
  };

  const handleDeleteUserWaitlistEntry = async (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete waitlist entry",
      message: "Delete this user waitlist entry? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingWaitlistId(id);
        try {
          const data = await api.deleteUserWaitlistEntry(id);
          if (data.success) {
            setNotice({ title: "Deleted", message: "Waitlist entry deleted." });
            fetchUserWaitlist();
          } else {
            setNotice({ title: "Error", message: data.message || "Failed to delete waitlist entry." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to delete waitlist entry.");
        } finally {
          setDeletingWaitlistId(null);
        }
      },
    });
  };

  const handleDeleteTherapistWaitlistEntry = async (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete waitlist entry",
      message: "Delete this therapist waitlist entry? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingWaitlistId(id);
        try {
          const data = await api.deleteTherapistWaitlistEntry(id);
          if (data.success) {
            setNotice({ title: "Deleted", message: "Waitlist entry deleted." });
            fetchTherapistWaitlist();
          } else {
            setNotice({ title: "Error", message: data.message || "Failed to delete waitlist entry." });
          }
        } catch (error) {
          handleAdminApiError(error, "Failed to delete waitlist entry.");
        } finally {
          setDeletingWaitlistId(null);
        }
      },
    });
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
            className={`${styles.tab} ${activeTab === "users" ? styles.active : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users className={styles.tabIcon} />
            Users ({users.length})
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
          <button
            className={`${styles.tab} ${activeTab === "groups" ? styles.active : ""}`}
            onClick={() => setActiveTab("groups")}
          >
            <MessageCircle className={styles.tabIcon} />
            Community Groups ({adminGroups.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === "insights" ? styles.active : ""}`}
            onClick={() => setActiveTab("insights")}
          >
            <BarChart3 className={styles.tabIcon} />
            Insights
          </button>
        </div>

        {activeTab === "users" ? (
          isLoadingUsers ? (
            <div className={styles.contentLoading}>Loading users...</div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>
              <Users className={styles.emptyIcon} />
              <p>No users found.</p>
            </div>
          ) : (
            <div className={styles.feedbacksGrid}>
              {users.map((user) => (
                <Card key={user.id} className={styles.feedbackCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <User className={styles.icon} />
                      {user.username}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>ID:</span>
                        <span>{user.id}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Joined:</span>
                        <span>{formatDateTime(user.created_at)}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Active:</span>
                        <span>{user.is_active ? "Yes" : "No"}</span>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={deletingUserId === user.id}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        {deletingUserId === user.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "feedback" ? (
          isLoadingFeedbacks ? (
            <div className={styles.contentLoading}>Loading feedbacks...</div>
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
                        <span>{formatDateTime(feedback.created_at)}</span>
                      </div>
                      {feedback.ip_address && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IP Address:</span>
                          <span>{feedback.ip_address}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        disabled={deletingFeedbackId === feedback.id}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        {deletingFeedbackId === feedback.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "contact" ? (
          isLoadingContacts ? (
            <div className={styles.contentLoading}>Loading contacts...</div>
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
                        <span>{formatDateTime(contact.created_at)}</span>
                      </div>
                      {contact.ip_address && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IP Address:</span>
                          <span>{contact.ip_address}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={deletingContactId === contact.id}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        {deletingContactId === contact.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "userWaitlist" ? (
          isLoadingUserWaitlist ? (
            <div className={styles.contentLoading}>Loading user waitlist...</div>
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
                        <span>{formatDateTime(entry.created_at)}</span>
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
            <div className={styles.contentLoading}>Loading therapist waitlist...</div>
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
                        <span>{formatDateTime(entry.created_at)}</span>
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
        ) : activeTab === "groups" ? (
          adminGroupsLoading ? (
            <div className={styles.contentLoading}>Loading community groups...</div>
          ) : adminGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageCircle className={styles.emptyIcon} />
              <p>No community groups found.</p>
            </div>
          ) : (
            <div className={styles.feedbacksGrid}>
              {adminGroups.map((group) => (
                <Card key={group.id} className={styles.feedbackCard}>
                  <CardHeader>
                    <CardTitle className={styles.cardTitle}>
                      <MessageCircle className={styles.icon} />
                      {group.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={styles.info}>
                      <div className={styles.infoItem}>
                        <Users className={styles.infoIcon} />
                        <span><strong>Members:</strong> {group.member_count}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <User className={styles.infoIcon} />
                        <span><strong>Created by:</strong> {group.created_by}</span>
                      </div>
                      {group.description && (
                        <div className={styles.infoItem}>
                          <span className={styles.label}>Description:</span>
                          <span>{group.description}</span>
                        </div>
                      )}
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Created:</span>
                        <span>{formatDateTime(group.created_at)}</span>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button
                        variant="outline"
                        onClick={() => openGroupMembers(group)}
                      >
                        <Eye className={styles.buttonIcon} />
                        View members
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteAdminGroup(group)}
                        disabled={deletingGroupId === group.id}
                      >
                        <Trash2 className={styles.buttonIcon} />
                        {deletingGroupId === group.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === "insights" ? (
          insightsLoading ? (
            <div className={styles.contentLoading}>Loading insights...</div>
          ) : !insights && !insightsFrom && !insightsTo ? (
            <div className={styles.emptyState}>
              <BarChart3 className={styles.emptyIcon} />
              <p>Load analytics for the last 30 days or pick a date range.</p>
              <div className={styles.insightsDateRow} style={{ marginTop: "1rem", justifyContent: "center" }}>
                <input
                  type="date"
                  value={insightsFrom}
                  onChange={(e) => setInsightsFrom(e.target.value)}
                  className={styles.insightsDateInput}
                />
                <input
                  type="date"
                  value={insightsTo}
                  onChange={(e) => setInsightsTo(e.target.value)}
                  className={styles.insightsDateInput}
                />
                <Button onClick={fetchInsights}>Load insights</Button>
              </div>
            </div>
          ) : !insights ? (
            <div className={styles.emptyState}>
              <BarChart3 className={styles.emptyIcon} />
              <p>Click &quot;Load insights&quot; to fetch analytics.</p>
              <div className={styles.insightsDateRow} style={{ marginTop: "1rem", justifyContent: "center" }}>
                <input
                  type="date"
                  value={insightsFrom}
                  onChange={(e) => setInsightsFrom(e.target.value)}
                  className={styles.insightsDateInput}
                />
                <input
                  type="date"
                  value={insightsTo}
                  onChange={(e) => setInsightsTo(e.target.value)}
                  className={styles.insightsDateInput}
                />
                <Button onClick={fetchInsights}>Load insights</Button>
              </div>
            </div>
          ) : (
            <div className={styles.insightsPanel}>
              <div className={styles.insightsDateRow}>
                <span>From {insights.from} to {insights.to}</span>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="date"
                    value={insightsFrom}
                    onChange={(e) => setInsightsFrom(e.target.value)}
                    className={styles.insightsDateInput}
                  />
                  <input
                    type="date"
                    value={insightsTo}
                    onChange={(e) => setInsightsTo(e.target.value)}
                    className={styles.insightsDateInput}
                  />
                  <Button size="sm" onClick={fetchInsights}>Refresh</Button>
                </div>
              </div>
              <div className={styles.insightsCards}>
                <Card className={styles.insightCard}>
                  <CardHeader>
                    <CardTitle className={styles.insightCardTitle}>
                      <TrendingUp className={styles.insightIcon} />
                      New signups (period)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className={styles.insightValue}>{insights.total_new_users}</span>
                  </CardContent>
                </Card>
                <Card className={styles.insightCard}>
                  <CardHeader>
                    <CardTitle className={styles.insightCardTitle}>
                      <User className={styles.insightIcon} />
                      Active users (period)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className={styles.insightValue}>{insights.total_active_users}</span>
                  </CardContent>
                </Card>
                <Card className={styles.insightCard}>
                  <CardHeader>
                    <CardTitle className={styles.insightCardTitle}>
                      <Repeat className={styles.insightIcon} />
                      Recurring users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className={styles.insightValue}>{insights.recurring_users_count}</span>
                    <p className={styles.insightHint}>Users active on 2+ days in range</p>
                  </CardContent>
                </Card>
              </div>
              <Card className={styles.insightsChartCard}>
                <CardHeader>
                  <CardTitle className={styles.insightCardTitle}>
                    <BarChart3 className={styles.insightIcon} />
                    New users per day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.new_users_per_day.length === 0 ? (
                    <p className={styles.insightHint}>No data in this range.</p>
                  ) : (
                    <div className={styles.barChart}>
                      {insights.new_users_per_day.map((d) => (
                        <div key={d.date} className={styles.barGroup}>
                          <div
                            className={styles.bar}
                            style={{
                              height: `${Math.max(4, (d.count / Math.max(1, Math.max(...insights.new_users_per_day.map((x) => x.count)))) * 120)}px`,
                            }}
                            title={`${d.date}: ${d.count}`}
                          />
                          <span className={styles.barLabel}>{d.date.slice(5)}</span>
                          <span className={styles.barCount}>{d.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className={styles.insightsChartCard}>
                <CardHeader>
                  <CardTitle className={styles.insightCardTitle}>
                    <LayoutGrid className={styles.insightIcon} />
                    Most used pages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.top_pages.length === 0 ? (
                    <p className={styles.insightHint}>No page views in this range. Activity is recorded when logged-in users browse the app.</p>
                  ) : (
                    <div className={styles.topPagesList}>
                      {insights.top_pages.map((p, i) => (
                        <div key={p.path} className={styles.topPageRow}>
                          <span className={styles.topPageRank}>{i + 1}</span>
                          <span className={styles.topPagePath}>{p.path}</span>
                          <span className={styles.topPageCount}>{p.count} views</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        ) : activeTab === "blocked" ? (
          isLoadingIPs ? (
            <div className={styles.contentLoading}>Loading blocked IPs...</div>
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
                        <span>{formatDateTime(blocked.created_at)}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.label}>Expires At:</span>
                        <span>{formatDateTime(blocked.expires_at)}</span>
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
          <div className={styles.contentLoading}>Loading therapists...</div>
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

      <ModalDialog
        open={confirmState.open}
        title={confirmState.title}
        onClose={() => {
          if (isConfirmBusy) return;
          setConfirmState({ open: false, title: "", message: "" });
        }}
        closeOnOverlayClick={!isConfirmBusy}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmState({ open: false, title: "", message: "" })}
              disabled={isConfirmBusy}
            >
              Cancel
            </Button>
            <Button
              variant={confirmState.confirmVariant || "default"}
              onClick={async () => {
                if (!confirmState.onConfirm) {
                  setConfirmState({ open: false, title: "", message: "" });
                  return;
                }
                setIsConfirmBusy(true);
                try {
                  await confirmState.onConfirm();
                } finally {
                  setIsConfirmBusy(false);
                  setConfirmState({ open: false, title: "", message: "" });
                }
              }}
              disabled={isConfirmBusy}
            >
              {isConfirmBusy ? "Please wait..." : confirmState.confirmText || "Confirm"}
            </Button>
          </>
        }
      >
        <p>{confirmState.message}</p>
      </ModalDialog>

      <ModalDialog
        open={!!notice}
        title={notice?.title || ""}
        onClose={() => setNotice(null)}
        actions={
          <Button variant="default" onClick={() => setNotice(null)}>
            OK
          </Button>
        }
      >
        <p>{notice?.message}</p>
      </ModalDialog>

      <ModalDialog
        open={!!membersModalGroup}
        title={membersModalGroup ? `Members — ${membersModalGroup.name}` : "Members"}
        onClose={() => { setMembersModalGroup(null); setAdminGroupMembers([]); }}
      >
        {adminGroupMembersLoading ? (
          <p>Loading members...</p>
        ) : adminGroupMembers.length === 0 ? (
          <p>No members in this group.</p>
        ) : (
          <ul className={styles.membersList}>
            {adminGroupMembers.map((m) => (
              <li key={m.user_id} className={styles.memberItem}>
                <strong>{m.username}</strong>
                <span className={styles.muted}>Joined {formatDateTime(m.joined_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </ModalDialog>
    </div>
  );
}

