"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { groupApi, Group, GroupMessage, ApiError } from "../lib/api";
import { getUserColor } from "../lib/userColor";
import styles from "./Community.module.scss";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader } from "../components/ui/ChatCard";
import { Send, Users, Plus, MessageSquare, ArrowLeft, LogIn, Home } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  username: string;
}

const PREDEFINED_TAGS = [
  "Anxiety",
  "Depression",
  "Stress",
  "Relationships",
  "Work",
  "Family",
  "Students",
  "LGBTQ+",
  "Mindfulness",
  "General Support",
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  // Removed isLoggedIn state - using user state instead for more reliable checks
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedTagsForCreate, setSelectedTagsForCreate] = useState<string[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [userMemberships, setUserMemberships] = useState<Set<string>>(new Set());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isFetchingMessagesRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is logged in
  const checkAuth = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const userData = localStorage.getItem("user");
    
    // Check if user data exists and is valid
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Avoid unnecessary re-renders by not updating state when user is unchanged.
        if (parsedUser && parsedUser.id) {
          setUser((prev) => {
            if (
              prev &&
              prev.id === parsedUser.id &&
              prev.username === parsedUser.username
            ) {
              return prev;
            }
            return parsedUser;
          });
        } else {
          // Invalid user data, clear it
          setUser(null);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("user");
        localStorage.removeItem("session_token");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initial auth check
    checkAuth();
    
    // One follow-up check shortly after mount for redirect flows.
    const timeoutId = setTimeout(() => checkAuth(), 300);
    
    // Check auth when page becomes visible (in case user signed in from another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };
    
    // Listen for storage changes (when user signs in from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "session_token") {
        checkAuth();
      }
    };
    
    // Also check on focus (in case user signed in in same tab)
    const handleFocus = () => {
      checkAuth();
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAuth, searchParams]);

  // Load groups
  useEffect(() => {
    loadGroups();
  }, []);

  // Ensure group creators are always treated as members of their own groups
  useEffect(() => {
    if (!user || groups.length === 0) return;

    setUserMemberships((prev) => {
      const next = new Set(prev);
      groups.forEach((g) => {
        if (g.created_by === user.username) {
          next.add(g.id);
        }
      });
      return next;
    });
  }, [user, groups]);

  // Connect WebSocket and load history when group is selected
  useEffect(() => {
    if (!selectedGroup) {
      // Clean up any existing socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    loadMessages(selectedGroup.id);
    if (user) {
      checkMembership(selectedGroup.id);
    }

    const connectWebSocket = () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("session_token") || "";
      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      const url = `${wsBase}/ws/chat?group_id=${encodeURIComponent(
        selectedGroup.id
      )}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        // Send an initial ping and keep-alive pings
        ws.send(JSON.stringify({ type: "ping", group_id: selectedGroup.id }));
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(
              JSON.stringify({ type: "ping", group_id: selectedGroup.id })
            );
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const evt = JSON.parse(event.data);
          if (evt.type === "message" && evt.message) {
            const m = evt.message as {
              id: string;
              text: string;
              created_at: string;
              sender_id: string;
              sender_username: string;
              group_id: string;
            };

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((msg) => msg.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id,
                  message: m.text,
                  created_at: m.created_at,
                  user_id: m.sender_id,
                  username: m.sender_username,
                  group_id: m.group_id,
                },
              ];
            });
          }
        } catch {
          // Ignore malformed events
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        // Optional: lightweight reconnect
        if (selectedGroup) {
          setTimeout(() => {
            if (!socketRef.current && document.visibilityState === "visible") {
              connectWebSocket();
            }
          }, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [selectedGroup, user]);

  const loadGroups = async (search?: string, tag?: string) => {
    try {
      setIsLoading(true);
      const response = await groupApi.getGroups(100, 0, search, tag);
      setGroups(response.groups || []);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to load groups");
      setGroups([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (groupId: string) => {
    if (isFetchingMessagesRef.current) return;
    try {
      isFetchingMessagesRef.current = true;
      const response = await groupApi.getGroupMessages(groupId, 100, 0);
      setMessages(response.messages || []);
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Failed to load messages:", apiError.message);
      setMessages([]); // Set empty array on error
    } finally {
      isFetchingMessagesRef.current = false;
    }
  };

  const checkMembership = async (groupId: string) => {
    if (!user) return;
    try {
      const response = await groupApi.getGroupMembers(groupId);
      const members = response.members || [];
      const isMember = members.some(m => m.user_id === user.id);
      if (isMember) {
        setUserMemberships(prev => new Set(prev).add(groupId));
      } else {
        setUserMemberships(prev => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }
    } catch (err) {
      // If we can't check membership, assume not a member
      setUserMemberships(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  const handleCreateGroup = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    // Check authentication directly from localStorage (more reliable)
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const sessionToken = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
    
    if (!userData) {
      setError("You must be signed in to create a group");
      router.push("/signin?redirect=/community");
      return;
    }

    // Refresh auth state
    checkAuth();
    
    // If no session token, still try - API will handle auth error
    // But warn the user
    if (!sessionToken) {
      console.warn("No session token found, but proceeding with API call");
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await groupApi.createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        tags: selectedTagsForCreate,
      });
      if (response.success && response.group) {
        setGroups([response.group, ...groups]);
        setUserMemberships(prev => new Set(prev).add(response.group!.id));
        setGroupName("");
        setGroupDescription("");
        setSelectedTagsForCreate([]);
        setShowCreateGroup(false);
        setSelectedGroup(response.group);
        setError(null); // Clear any previous errors
      } else {
        setError(response.message || "Failed to create group");
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Create group error:", err);
      setError(apiError.message || "Failed to create group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditName(group.name);
    setEditDescription(group.description || "");
    setEditTags(group.tags || []);
    setShowCreateGroup(false);
  };

  const handleUpdateGroup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingGroupId || !editName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await groupApi.updateGroup({
        id: editingGroupId,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        tags: editTags,
      });
      // Reload groups to reflect changes
      await loadGroups(searchTerm, selectedTag || undefined);
      // Update selectedGroup if needed
      setSelectedGroup((prev) =>
        prev && prev.id === editingGroupId
          ? { ...prev, name: editName.trim(), description: editDescription.trim() || "", tags: editTags }
          : prev
      );
      setEditingGroupId(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to update group");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await groupApi.deleteGroup(groupId);
      await loadGroups(searchTerm, selectedTag || undefined);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setMessages([]);
      }
      setUserMemberships(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to delete group");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    // Check authentication directly from localStorage
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!userData) {
      setError("You must be signed in to join a group");
      router.push("/signin?redirect=/community");
      return;
    }
    
    // Refresh auth state
    checkAuth();

    try {
      setIsLoading(true);
      setError(null);
      await groupApi.joinGroup(groupId);
      setUserMemberships(prev => new Set(prev).add(groupId));
      await loadGroups(); // Reload groups to update member count
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(groups.find(g => g.id === groupId) || null);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to join group");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    // Check authentication directly from localStorage
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!userData) {
      setError("You must be signed in to send messages");
      router.push("/signin?redirect=/community");
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);

      // Prefer WebSocket for realtime sending
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "message",
            group_id: selectedGroup.id,
            text: newMessage.trim(),
          })
        );
        setNewMessage("");
      } else {
        // Fallback to HTTP if WebSocket is not available
        const response = await groupApi.sendGroupMessage(selectedGroup.id, {
          message: newMessage,
        });
        if (response.success && response.msg) {
          setMessages([...messages, response.msg]);
          setNewMessage("");
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    // Interpret the backend timestamp once and render a stable time
    // that matches what the server records, without double timezone shifts.
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    // Use UTC hours/minutes so we don't apply the viewer's timezone offset
    // on top of the server's stored time.
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");

    return `${hh}:${mm}`;
  };

  const isUserMember = (groupId: string) => {
    // Creator of the group is implicitly a member
    const group = groups.find((g) => g.id === groupId);
    if (group && user && group.created_by === user.username) {
      return true;
    }
    return userMemberships.has(groupId);
  };

  return (
    <div className={styles.communityPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Community Forum</h1>
            <Link href="/home" className={styles.homeLink}>
              <Home size={20} />
              <span>Home</span>
            </Link>
          </div>
          <p className={styles.subtitle}>
            Join public groups and chat with others in a safe space
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Sidebar - Group List */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2>Groups</h2>
              {user ? (
                <Button
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                  variant="healing"
                  size="default"
                  className={styles.createButton}
                >
                  <Plus size={16} /> Create Group
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/signin?redirect=/community")}
                  variant="healing"
                  size="default"
                  className={styles.createButton}
                >
                  <LogIn size={16} /> Sign In to Create
                </Button>
              )}
            </div>

            {/* Search */}
            <div className={styles.searchRow}>
              <Input
                placeholder="Search groups by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadGroups(searchTerm, selectedTag || undefined);
                  }
                }}
                className={styles.searchInput}
              />
              {(isSearchFocused || searchTerm.trim().length > 0) && (
                <Button
                  onClick={() => loadGroups(searchTerm, selectedTag || undefined)}
                  variant="healing"
                  size="default"
                  className={styles.searchButton}
                >
                  Search
                </Button>
              )}
            </div>

            {/* Tags only visible when interacting with search */}
            {(isSearchFocused || searchTerm.trim().length > 0) && (
              <div className={styles.tagsFilter}>
                {PREDEFINED_TAGS.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagChip} ${active ? styles.tagChipActive : ""}`}
                      onClick={() => {
                        const next = active ? null : tag;
                        setSelectedTag(next);
                        loadGroups(searchTerm, next || undefined);
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create Group Form */}
            {showCreateGroup && !editingGroupId && (
              <Card className={styles.createGroupCard}>
                <CardHeader>
                  <h3>Create New Group</h3>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGroup}>
                    <Input
                      placeholder="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className={styles.input}
                      required
                      disabled={isLoading}
                    />
                    <div className={styles.tagsSelector}>
                      <p className={styles.tagsLabel}>Select up to 3 tags (optional)</p>
                      <div className={styles.tagsChips}>
                        {PREDEFINED_TAGS.map((tag) => {
                          const active = selectedTagsForCreate.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`${styles.tagChip} ${active ? styles.tagChipActive : ""}`}
                              onClick={() => {
                                setSelectedTagsForCreate((prev) => {
                                  if (prev.includes(tag)) {
                                    return prev.filter((t) => t !== tag);
                                  }
                                  if (prev.length >= 3) return prev;
                                  return [...prev, tag];
                                });
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Input
                      placeholder="Description (optional)"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className={styles.input}
                      disabled={isLoading}
                    />
                    <div className={styles.buttonGroup}>
                      <Button
                        type="submit"
                        variant="default"
                        size="lg"
                        disabled={isLoading || !groupName.trim()}
                        className={styles.submitButton}
                      >
                        {isLoading ? "Creating..." : "Create Group"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowCreateGroup(false);
                          setGroupName("");
                          setGroupDescription("");
                          setError(null);
                        }}
                        variant="ghost"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Group Form (only for creator) */}
            {editingGroupId && (
              <Card className={styles.createGroupCard}>
                <CardHeader>
                  <h3>Edit Group</h3>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateGroup}>
                    <Input
                      placeholder="Group name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={styles.input}
                      required
                      disabled={isLoading}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className={styles.input}
                      disabled={isLoading}
                    />
                    <div className={styles.tagsSelector}>
                      <p className={styles.tagsLabel}>Update tags (optional)</p>
                      <div className={styles.tagsChips}>
                        {PREDEFINED_TAGS.map((tag) => {
                          const active = editTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`${styles.tagChip} ${active ? styles.tagChipActive : ""}`}
                              onClick={() => {
                                setEditTags((prev) => {
                                  if (prev.includes(tag)) {
                                    return prev.filter((t) => t !== tag);
                                  }
                                  if (prev.length >= 3) return prev;
                                  return [...prev, tag];
                                });
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading || !editName.trim()}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className={styles.submitButton}
                        style={{ background: "#6c757d" }}
                        onClick={() => setEditingGroupId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Group List */}
            <div className={styles.groupList}>
              {isLoading ? (
                <div className={styles.loading}>Loading groups...</div>
              ) : groups.length === 0 ? (
                <div className={styles.emptyState}>No groups yet. Create one!</div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className={`${styles.groupItem} ${
                      selectedGroup?.id === group.id ? styles.active : ""
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className={styles.groupInfo}>
                      <h3>{group.name}</h3>
                      <p>{group.description || "No description"}</p>
                      <div className={styles.groupMeta}>
                        <span>
                          <Users size={14} /> {group.member_count} members
                        </span>
                        <span>by {group.created_by}</span>
                      </div>
                    </div>
                    {!isUserMember(group.id) && user && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGroup(group.id);
                        }}
                        className={styles.joinButton}
                        size="sm"
                      >
                        Join
                      </Button>
                    )}
                    {user && group.created_by === user.username && (
                      <div
                        className={styles.creatorActions}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.editButton}
                          onClick={() => startEditingGroup(group)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className={styles.deleteButton}
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={styles.chatArea}>
            {selectedGroup ? (
              <>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <Button
                    onClick={() => setSelectedGroup(null)}
                    variant="ghost"
                    className={styles.backButton}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <div className={styles.chatHeaderInfo}>
                    <h2>{selectedGroup.name}</h2>
                    <p>{selectedGroup.description || "No description"}</p>
                    <span>
                      <Users size={14} /> {selectedGroup.member_count} members
                    </span>
                  </div>
                  {!isUserMember(selectedGroup.id) && user && (
                    <Button
                      onClick={() => handleJoinGroup(selectedGroup.id)}
                      className={styles.joinButton}
                    >
                      Join Group
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <div className={styles.messagesContainer}>
                  {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                      No messages yet. Be the first to say something!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const userColor = getUserColor(msg.user_id);
                      const isOwnMessage = msg.user_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.message} ${
                            isOwnMessage ? styles.ownMessage : ""
                          }`}
                          style={{
                            backgroundColor: isOwnMessage ? userColor : "#f5f5f5",
                            borderLeft: isOwnMessage ? "none" : `4px solid ${userColor}`,
                          }}
                        >
                          <div className={styles.messageHeader}>
                            <span
                              className={styles.username}
                              style={{
                                color: isOwnMessage
                                  ? "rgba(255, 255, 255, 0.95)"
                                  : userColor,
                              }}
                            >
                              {msg.username}
                            </span>
                            <span
                              className={styles.timestamp}
                              style={{
                                color: isOwnMessage
                                  ? "rgba(255, 255, 255, 0.8)"
                                  : "rgba(0, 0, 0, 0.6)",
                              }}
                            >
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                          <div
                            className={styles.messageContent}
                            style={{
                              color: isOwnMessage ? "white" : "#1a1a1a",
                            }}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className={styles.messageInput}>
                  {user && isUserMember(selectedGroup.id) ? (
                    <div className={styles.inputWrapper}>
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className={styles.input}
                        disabled={isSending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className={styles.sendButton}
                      >
                        <Send size={16} />
                      </Button>
                    </div>
                  ) : !user ? (
                    <div className={styles.authPrompt}>
                      <LogIn size={16} />
                      <span>
                        <Link href="/signin">Sign in</Link> or{" "}
                        <Link href="/signup">sign up</Link> to send messages
                      </span>
                    </div>
                  ) : (
                    <div className={styles.authPrompt}>
                      <MessageSquare size={16} />
                      <span>Join this group to send messages</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.emptyChat}>
                <MessageSquare size={48} />
                <h2>Select a group to start chatting</h2>
                <p>Choose a group from the sidebar to view and participate in conversations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

