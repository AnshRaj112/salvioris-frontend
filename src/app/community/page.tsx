"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Community.module.scss";
import { groupApi, chatApi, getMe, Group, GroupMessage, GroupMember, CreateGroupData } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ModalDialog } from "../components/ui/ModalDialog";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws/chat";

interface ActiveGroup extends Group {
  is_member?: boolean;
}

export default function CommunityPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [activeGroup, setActiveGroup] = useState<ActiveGroup | null>(null);
  const [memberList, setMemberList] = useState<GroupMember[]>([]);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createData, setCreateData] = useState<CreateGroupData>({
    name: "",
    description: "",
    tags: [],
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", tags: [] as string[] });
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const activeGroupRef = useRef<ActiveGroup | null>(null);
  
  // Keep ref in sync with activeGroup
  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  // Establish a single WebSocket connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("session_token");
    if (!token) {
      console.warn("No session token found, WebSocket will not connect");
      return;
    }

    const url = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      // Subscribe will be handled by the separate useEffect when activeGroup changes
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        // Handle ChatEvent from backend: type, group_id, sender_id, username, message, timestamp
        if (data.type === "message") {
          // Use ref to get current activeGroup (avoids stale closure)
          const currentGroup = activeGroupRef.current;
          if (!currentGroup || data.group_id !== currentGroup.id) {
            console.log("Message not for current group, ignoring");
            return;
          }
          
          // Convert ChatEvent to GroupMessage format
          const message: GroupMessage = {
            id: data.sender_id + "-" + Date.now(), // Generate temporary ID
            group_id: data.group_id,
            user_id: data.sender_id,
            username: data.username || "Unknown",
            message: data.message,
            created_at: data.timestamp || new Date().toISOString(),
          };
          console.log("Adding message to state:", message);
          setMessages((prev) => [...prev, message]);
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err, event.data);
      }
    };

    ws.onerror = (event) => {
      console.warn("WebSocket connection error", {
        type: event.type,
        readyState: ws.readyState,
        url,
      });
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      setWsConnected(false);
      wsRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Update message handler when activeGroup changes
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    // Re-subscribe message handler closure to use current activeGroup
    // The actual subscription is handled by the separate useEffect below
  }, [activeGroup?.id]);

  // Load initial groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await groupApi.getGroups(50, 0, search, tag);
        setGroups(res.groups);
      } catch {
        // ignore for now
      }
    };
    fetchGroups();
  }, [search, tag]);

  // Load current user once
  useEffect(() => {
    getMe().then((me) => setCurrentUserID(me?.user_id ?? null));
  }, []);

  // Load members when active group changes
  useEffect(() => {
    if (!activeGroup) return;

    const loadMembers = async () => {
      try {
        const res = await groupApi.getGroupMembers(activeGroup.id);
        setMemberList(res.members);
        const sessionToken =
          typeof window !== "undefined"
            ? window.localStorage.getItem("session_token")
            : null;
        setIsMember(!!sessionToken && res.members.length > 0);
      } catch {
        setMemberList([]);
      }
    };
    loadMembers();
  }, [activeGroup]);

  // Subscribe to group over WebSocket when active group changes
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !activeGroup) return;
    
    ws.send(
      JSON.stringify({
        type: "subscribe",
        group_id: activeGroup.id,
      })
    );

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN && activeGroup) {
        ws.send(
          JSON.stringify({
            type: "unsubscribe",
            group_id: activeGroup.id,
          })
        );
      }
    };
  }, [activeGroup]);

  const activeSlug = useMemo(
    () => (activeGroup?.slug ? `/community/group/${activeGroup.slug}` : null),
    [activeGroup?.slug]
  );

  const loadHistory = useCallback(async (appendTop: boolean) => {
    if (!activeGroup) return;
    setLoadingHistory(true);
    try {
      const before =
        appendTop && messages.length > 0
          ? messages[0].created_at
          : undefined;
      const res = await chatApi.loadHistory(activeGroup.id, before, 50);
      setHasMore(res.has_more);
      if (appendTop) {
        setMessages((prev) => [...res.messages, ...prev]);
      } else {
        setMessages(res.messages);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, [activeGroup, messages]);

  useEffect(() => {
    if (activeGroup) {
      loadHistory(false);
    }
  }, [activeGroup, loadHistory]);

  const handleSelectGroup = (group: Group) => {
    setActiveGroup(group);
  };

  const handleCreateGroup = async () => {
    if (!createData.name.trim()) {
      setCreateError("Group name is required.");
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      const payload: CreateGroupData = {
        name: createData.name.trim(),
        description: createData.description?.trim() || "",
        tags:
          createData.tags && createData.tags.length > 0
            ? createData.tags
            : [],
      };
      const res = await groupApi.createGroup(payload);
      if (res.success && res.group) {
        // Refresh list and select the new group
        const refreshed = await groupApi.getGroups(50, 0, "", "");
        setGroups(refreshed.groups);
        setActiveGroup(res.group);
        setCreateData({ name: "", description: "", tags: [] });
      } else {
        setCreateError(res.message || "Failed to create group.");
      }
    } catch (e: unknown) {
      setCreateError(
        e instanceof Error ? e.message : "Failed to create group."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!activeGroup) return;
    try {
      await groupApi.joinGroup(activeGroup.id);
      setIsMember(true);
      const res = await groupApi.getGroupMembers(activeGroup.id);
      setMemberList(res.members);
    } catch {
      // ignore for now
    }
  };

  const handleEditGroup = () => {
    if (!activeGroup) return;
    setEditForm({
      name: activeGroup.name,
      description: activeGroup.description ?? "",
      tags: activeGroup.tags ?? [],
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!activeGroup || !editForm.name.trim()) {
      setEditError("Group name is required.");
      return;
    }
    setEditError(null);
    setUpdating(true);
    try {
      await groupApi.updateGroup({
        id: activeGroup.id,
        name: editForm.name.trim(),
        description: editForm.description?.trim() || "",
        tags: editForm.tags?.length ? editForm.tags : [],
      });
      setActiveGroup((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name.trim(),
              description: editForm.description?.trim() || "",
              tags: editForm.tags,
            }
          : null
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeGroup.id
            ? {
                ...g,
                name: editForm.name.trim(),
                description: editForm.description?.trim() || "",
                tags: editForm.tags,
              }
            : g
        )
      );
      setIsEditModalOpen(false);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Failed to update group.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroup || !window.confirm("Delete this group? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await groupApi.deleteGroup(activeGroup.id);
      setActiveGroup(null);
      const res = await groupApi.getGroups(50, 0, "", "");
      setGroups(res.groups);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeGroup) return;
    setRemovingUserId(userId);
    try {
      await groupApi.removeMember(activeGroup.id, userId);
      const res = await groupApi.getGroupMembers(activeGroup.id);
      setMemberList(res.members);
    } catch {
      // ignore
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleSend = async () => {
    const ws = wsRef.current;
    if (!activeGroup || !ws || ws.readyState !== WebSocket.OPEN || !messageText.trim()) {
      console.warn("Cannot send: WebSocket not ready or no active group");
      return;
    }
    setSending(true);
    try {
      const payload = {
        type: "message",
        group_id: activeGroup.id,
        text: messageText.trim(),
      };
      console.log("Sending message:", payload);
      ws.send(JSON.stringify(payload));
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className={styles.communityPage}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleHighlight}>Community</span> spaces
          </h1>
          <p className={styles.subtitle}>
            Join supportive, Telegram-style group chats powered by real-time
            messaging. Create or discover groups that feel safe for you.
          </p>
        </header>

        <section className={styles.content}>
          <div className={styles.sidebarCard}>
            <div className={styles.searchRow}>
              <div className={styles.searchInputs}>
                <Input
                  placeholder="Search groups by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Input
                  placeholder="Filter by tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>
              <div className={styles.createRow}>
                <p className={styles.createHint}>
                  Can&apos;t find your space?
                </p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create group
                </Button>
              </div>
            </div>

            <div className={styles.groupsList}>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={styles.groupItem}
                  onClick={() => handleSelectGroup(g)}
                >
                  <div className={styles.groupTitleRow}>
                    <div className={styles.groupName}>{g.name}</div>
                    <span className={styles.groupMeta}>
                      {g.member_count} members
                    </span>
                  </div>
                  {g.description && (
                    <div className={styles.groupMeta}>{g.description}</div>
                  )}
                  <div className={styles.groupMeta}>
                    {g.tags?.slice(0, 3).map((t) => (
                      <span key={t} className={styles.tagChip}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              {groups.length === 0 && (
                <div className={styles.groupMeta}>
                  No groups yet. Be the first to create one.
                </div>
              )}
            </div>
          </div>

          <div className={styles.chatPanel}>
            {activeGroup ? (
              <>
                <div className={styles.chatHeader}>
                  <div>
                    <div className={styles.chatTitle}>{activeGroup.name}</div>
                    <div className={styles.chatMeta}>
                      <button
                        type="button"
                        className={styles.membersLink}
                        onClick={() => setIsMembersModalOpen(true)}
                      >
                        {memberList.length} members
                      </button>
                      {activeSlug && (
                        <>
                          {" • "}
                          <button
                            type="button"
                            className={styles.shareLink}
                            onClick={() => {
                              if (typeof window === "undefined") return;
                              const full =
                                window.location.origin + activeSlug;
                              navigator.clipboard.writeText(full);
                            }}
                          >
                            Copy invite link
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.chatHeaderActions}>
                    {activeGroup.is_creator && (
                      <>
                        <Button size="sm" variant="default" onClick={handleEditGroup}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteGroup}
                          disabled={deleting}
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </Button>
                      </>
                    )}
                    {!isMember && !activeGroup.is_creator && (
                      <Button size="sm" onClick={handleJoin}>
                        Join
                      </Button>
                    )}
                  </div>
                </div>

                {messages.length === 0 && !loadingHistory ? (
                  <div className={styles.emptyChatState}>
                    No messages yet. Say hello and start the conversation.
                  </div>
                ) : (
                  <>
                    <div className={styles.messagesArea}>
                      {messages
                        .slice()
                        .reverse()
                        .map((m) => (
                          <div
                            key={m.id}
                            className={styles.messageBubble}
                          >
                            <div className={styles.messageHeader}>
                              <span className={styles.messageAuthor}>
                                {m.username}
                              </span>
                              <span className={styles.messageTime}>
                                {new Date(
                                  m.created_at
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={styles.messageText}>
                              {m.message}
                            </div>
                          </div>
                        ))}
                    </div>
                    {hasMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingHistory}
                        onClick={() => loadHistory(true)}
                      >
                        Load older messages
                      </Button>
                    )}
                  </>
                )}

                <div className={styles.inputArea}>
                  {isMember ? (
                    <>
                      <Textarea
                        rows={2}
                        placeholder="Type a supportive message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", flexDirection: "column", gap: "0.5rem" }}>
                        {!wsConnected && (
                          <p className={styles.wsWarning}>
                            Connecting to chat... Please wait.
                          </p>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <Button
                            onClick={handleSend}
                            disabled={sending || !messageText.trim() || !wsConnected || !activeGroup}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className={styles.joinBanner}>
                      Join this group to send messages. You will stay a member
                      so you never have to join again.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.emptyChatState}>
                Select a group from the left to start chatting in real time.
              </div>
            )}
          </div>
        </section>

        <ModalDialog
          open={isCreateModalOpen}
          title="Create a new group"
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateError(null);
          }}
          actions={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={creating || !createData.name.trim()}
              >
                {creating ? "Creating..." : "Create group"}
              </Button>
            </>
          }
        >
          <div className={styles.createForm}>
            <div className={styles.formRow}>
              <label className={styles.label}>Group name</label>
              <Input
                placeholder="e.g. Night Owls Support"
                value={createData.name}
                onChange={(e) =>
                  setCreateData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Description (optional)</label>
              <Input
                placeholder="Short description that feels safe and welcoming"
                value={createData.description}
                onChange={(e) =>
                  setCreateData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Tags (comma separated, optional)
              </label>
              <Input
                placeholder="anxiety, burnout, students"
                value={createData.tags?.join(", ") || ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const tags = raw
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  setCreateData((prev) => ({ ...prev, tags }));
                }}
              />
            </div>
            {createError && (
              <p className={styles.errorText}>{createError}</p>
            )}
          </div>
        </ModalDialog>

        <ModalDialog
          open={isMembersModalOpen}
          title={activeGroup ? `Members — ${activeGroup.name}` : "Members"}
          onClose={() => setIsMembersModalOpen(false)}
        >
          <div className={styles.membersList}>
            {memberList.length === 0 ? (
              <p className={styles.membersEmpty}>No members yet.</p>
            ) : (
              <ul className={styles.membersListUl}>
                {memberList.map((m) => (
                  <li key={m.user_id} className={styles.membersListItem}>
                    <span>{m.username}</span>
                    {activeGroup?.is_creator && currentUserID && m.user_id !== currentUserID && (
                      <Button
                        size="sm"
                        variant="default"
                        className={styles.memberRemoveBtn}
                        onClick={() => handleRemoveMember(m.user_id)}
                        disabled={removingUserId === m.user_id}
                      >
                        {removingUserId === m.user_id ? "Removing..." : "Remove"}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ModalDialog>

        <ModalDialog
          open={isEditModalOpen}
          title="Edit group"
          onClose={() => { setIsEditModalOpen(false); setEditError(null); }}
          actions={
            <>
              <Button variant="ghost" onClick={() => { setIsEditModalOpen(false); setEditError(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={updating || !editForm.name.trim()}>
                {updating ? "Saving..." : "Save"}
              </Button>
            </>
          }
        >
          <div className={styles.createForm}>
            <div className={styles.formRow}>
              <label className={styles.label}>Group name</label>
              <Input
                placeholder="e.g. Night Owls Support"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Description (optional)</label>
              <Input
                placeholder="Short description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.label}>Tags (comma separated)</label>
              <Input
                placeholder="anxiety, burnout, students"
                value={editForm.tags?.join(", ") || ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const tags = raw.split(",").map((t) => t.trim()).filter(Boolean);
                  setEditForm((prev) => ({ ...prev, tags }));
                }}
              />
            </div>
            {editError && <p className={styles.errorText}>{editError}</p>}
          </div>
        </ModalDialog>
      </div>
    </main>
  );
}


