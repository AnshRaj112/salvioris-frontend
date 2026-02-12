"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Send, MessageSquare, X, LogIn, UserPlus, LogOut, Heart, Star, CheckCircle } from "lucide-react";
import Image from "next/image";
import salviorisLogo from "../../assets/salvioris.jpg";
import { api, ApiError, Vent, CreateVentResponse, Journal } from "../lib/api";
import { Textarea } from "../components/ui/textarea";
import { formatChatTime } from "../lib/time";
import styles from "./Vent.module.scss";

interface User {
  id: string;
  username: string;
  created_at?: string;
  // Legacy support
  name?: string;
  email?: string;
}

export default function VentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [vents, setVents] = useState<Vent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [showEncouragementModal, setShowEncouragementModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const recentMessageTimesRef = useRef<number[]>([]);
  const encouragementShownRef = useRef<boolean>(false);
  const feedbackShownRef = useRef<boolean>(false);
  const messageCountRef = useRef<number>(0);

  // Calculate how many messages fit on screen (estimate: ~100px per message)
  const calculateInitialChunkSize = () => {
    if (typeof window === "undefined") return 20;
    const viewportHeight = window.innerHeight;
    const estimatedMessageHeight = 100; // Average height per message
    const headerHeight = 200; // Approximate header height
    const inputAreaHeight = 120; // Approximate input area height
    const availableHeight = viewportHeight - headerHeight - inputAreaHeight;
    const estimatedMessages = Math.ceil(availableHeight / estimatedMessageHeight);
    return Math.max(10, Math.min(estimatedMessages, 30)); // Between 10 and 30 messages
  };

  // Prevent body scroll when feedback modal is open (but allow closing)
  useEffect(() => {
    if (showFeedbackModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showFeedbackModal]);

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData && userData.trim()) {
        try {
          // Validate that it looks like JSON before parsing
          const trimmed = userData.trim();
          if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsLoggedIn(true);
          } else {
            console.error("Invalid user data format, clearing localStorage");
            localStorage.removeItem("user");
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
          // Clear invalid data
          localStorage.removeItem("user");
        }
      } else {
        // Show auth prompt popup for new users after a short delay
        const timer = setTimeout(() => {
          setShowAuthPrompt(true);
        }, 500);
        return () => clearTimeout(timer);
      }

      // For non-logged-in users, load from sessionStorage
      if (!userData || !userData.trim()) {
        const sessionVents = sessionStorage.getItem("vent_messages");
        if (sessionVents && sessionVents.trim()) {
          try {
            // Validate that it looks like JSON before parsing
            const trimmed = sessionVents.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
              const parsedVents = JSON.parse(sessionVents);
              if (Array.isArray(parsedVents)) {
                setVents(parsedVents);
              }
            } else {
              console.error("Invalid session vents format, clearing sessionStorage");
              sessionStorage.removeItem("vent_messages");
            }
          } catch (e) {
            console.error("Error parsing session vents:", e);
            // Clear invalid data
            sessionStorage.removeItem("vent_messages");
          }
        }
      }

      // Clear session storage on window close for non-logged-in users
      const handleBeforeUnload = () => {
        if (!userData) {
          sessionStorage.removeItem("vent_messages");
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadVents = useCallback(async (skipValue: number, isInitial: boolean = false) => {
    if (!isLoggedIn || !user?.id) return;

    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const chunkSize = isInitial ? calculateInitialChunkSize() : calculateInitialChunkSize();
      const response = await api.getVents(user.id, chunkSize, skipValue);
      if (response.success) {
        // Backend returns newest first, but we want newest at bottom
        // So we reverse the array for display
        const reversedVents = [...response.vents].reverse();
        
        if (isInitial) {
          setVents(reversedVents);
          // Scroll to bottom after initial load
          setTimeout(() => scrollToBottom(), 100);
        } else {
          // When loading more (older messages), prepend them (they're already older)
          const previousScrollHeight = messagesAreaRef.current?.scrollHeight || 0;
          setVents((prev) => [...reversedVents, ...prev]);
          // Maintain scroll position after prepending
          setTimeout(() => {
            if (messagesAreaRef.current) {
              const newScrollHeight = messagesAreaRef.current.scrollHeight;
              messagesAreaRef.current.scrollTop = newScrollHeight - previousScrollHeight;
            }
          }, 0);
        }
        setHasMore(response.has_more);
        setSkip(skipValue + response.vents.length);
      }
    } catch (err) {
      console.error("Error loading vents:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isLoggedIn, user?.id]);

  // Load initial vents for logged-in users
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadVents(0, true);
    }
  }, [isLoggedIn, user?.id, loadVents]);

  // Load recent journals for logged-in users
  useEffect(() => {
    const loadJournals = async () => {
      if (!isLoggedIn || !user?.id) return;
      try {
        setIsLoadingJournals(true);
        const response = await api.getJournals(user.id, 10, 0);
        if (response.success) {
          setJournals(response.journals);
        }
      } catch (err) {
        console.error("Error loading journals:", err);
      } finally {
        setIsLoadingJournals(false);
      }
    };
    loadJournals();
  }, [isLoggedIn, user?.id]);

  // Intersection Observer for infinite scroll (load more when scrolling up)
  useEffect(() => {
    if (!isLoggedIn || !hasMore || isLoadingMore) return;

    const currentRef = loadingMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadVents(skip, false);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, skip, isLoggedIn, loadVents]);

  // Also handle scroll to top for loading more
  useEffect(() => {
    if (!isLoggedIn || !hasMore || isLoadingMore) return;

    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return;

    const handleScroll = () => {
      // Load more when near the top (within 200px)
      if (messagesArea.scrollTop < 200 && hasMore && !isLoadingMore) {
        loadVents(skip, false);
      }
    };

    messagesArea.addEventListener("scroll", handleScroll);
    return () => messagesArea.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, skip, isLoggedIn, loadVents]);

  const checkAndShowEncouragement = (messageText: string) => {
    // Don't show if already shown once
    if (encouragementShownRef.current) {
      return;
    }

    const now = Date.now();
    const LONG_MESSAGE_THRESHOLD = 500; // characters
    const CONTINUOUS_MESSAGE_WINDOW = 30000; // 30 seconds
    const CONTINUOUS_MESSAGE_COUNT = 5; // 5 messages

    // Check for long message
    const isLongMessage = messageText.length > LONG_MESSAGE_THRESHOLD;

    // Check for continuous messages
    // Remove timestamps older than the window
    recentMessageTimesRef.current = recentMessageTimesRef.current.filter(
      (time) => now - time < CONTINUOUS_MESSAGE_WINDOW
    );
    
    // Add current message time
    recentMessageTimesRef.current.push(now);
    
    const isContinuousMessaging = recentMessageTimesRef.current.length >= CONTINUOUS_MESSAGE_COUNT;

    // Show encouragement if either condition is met (only once)
    if ((isLongMessage || isContinuousMessaging) && !encouragementShownRef.current) {
      encouragementShownRef.current = true;
      setShowEncouragementModal(true);
    }
  };

  const checkAndShowFeedback = () => {
    // Don't show if already shown once
    if (feedbackShownRef.current) {
      return;
    }

    // Increment message count
    messageCountRef.current += 1;

    // Show feedback modal after 10 messages
    if (messageCountRef.current >= 10 && !feedbackShownRef.current) {
      feedbackShownRef.current = true;
      setShowFeedbackModal(true);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    // Show auth modal for non-logged-in users
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    setIsSending(true);
    const messageText = message;
    setMessage("");

    // Check if we should show encouragement
    checkAndShowEncouragement(messageText);

    // Check if we should show feedback request (after 10 messages)
    checkAndShowFeedback();

    try {
      const response = await api.createVent({
        message: messageText,
        user_id: user?.id,
      }) as CreateVentResponse;

      // Check if blocked
      if (response.blocked) {
        setIsBlocked(true);
        setWarningMessage(response.message || "Your access has been temporarily restricted.");
        setMessage(""); // Clear message
        return;
      }

      // Check if warning
      if (response.warning) {
        setWarningMessage(response.message || "Your message contains content that may violate our community guidelines.");
        setMessage(messageText); // Restore message so user can edit
        // Show warning for 5 seconds
        setTimeout(() => {
          setWarningMessage(null);
        }, 5000);
        return;
      }

      // Success - message was created
      if (response.success && response.vent) {
        const newVent: Vent = {
          id: response.vent.id,
          message: response.vent.message,
          created_at: response.vent.created_at,
          username: response.vent.username, // Anonymous username
          user_id: response.vent.user_id, // Legacy support
        };
        // Add new message at the end (newest at bottom)
        setVents((prev) => [...prev, newVent]);
        setWarningMessage(null); // Clear any previous warnings
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error sending vent:", apiError);
      
      // Check if it's a blocked response
      if (apiError.status === 403) {
        setIsBlocked(true);
        setWarningMessage(apiError.message || "Your access has been temporarily restricted.");
      } else {
        setWarningMessage(apiError.message || "Failed to send message. Please try again.");
        setMessage(messageText); // Restore message on error
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAsGuest = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    const messageText = message;
    setMessage("");

    // Check if we should show encouragement
    checkAndShowEncouragement(messageText);

    // Check if we should show feedback request
    checkAndShowFeedback();

    try {
      // Send to backend for moderation check (even as guest)
      const response = await api.createVent({
        message: messageText,
        // No user_id for guests
      }) as CreateVentResponse;

      // Check if blocked
      if (response.blocked) {
        setIsBlocked(true);
        setWarningMessage(response.message || "Your access has been temporarily restricted.");
        return;
      }

      // Check if warning
      if (response.warning) {
        setWarningMessage(response.message || "Your message contains content that may violate our community guidelines.");
        setMessage(messageText); // Restore message so user can edit
        // Show warning for 5 seconds
        setTimeout(() => {
          setWarningMessage(null);
        }, 5000);
        return;
      }

      // Success - message passed moderation (but won't be saved for guests)
      // Only add to local state for guests
      const newVent: Vent = {
        id: `guest_${Date.now()}`,
        message: messageText,
        created_at: new Date().toISOString(),
      };

      const updatedVents = [newVent, ...vents];
      setVents(updatedVents);
      setWarningMessage(null); // Clear any previous warnings

      // Save to sessionStorage
      sessionStorage.setItem("vent_messages", JSON.stringify(updatedVents));
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error sending vent:", apiError);
      
      // Check if it's a blocked response
      if (apiError.status === 403) {
        setIsBlocked(true);
        setWarningMessage(apiError.message || "Your access has been temporarily restricted.");
      } else {
        setWarningMessage(apiError.message || "Failed to send message. Please try again.");
        setMessage(messageText); // Restore message on error
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoggedIn) {
        handleSend();
      } else {
        handleSendAsGuest();
      }
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    // Clear user state
    setUser(null);
    setIsLoggedIn(false);
    // Clear vents (they're user-specific)
    setVents([]);
    // Optionally redirect to home or stay on page
    // router.push("/");
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Feedback is optional - if empty, just close the modal
    if (!feedback.trim()) {
      setShowFeedbackModal(false);
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      const response = await api.submitFeedback({
        feedback: feedback.trim(),
      });

      if (response.success) {
        setFeedbackSubmitted(true);
        setFeedback("");
        // Close modal after 3 seconds
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackSubmitted(false);
        }, 3000);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setFeedbackError(apiError.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className={styles.ventPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoIcon}>
                <Image 
                  src={salviorisLogo} 
                  alt="SALVIORIS Logo" 
                  width={48} 
                  height={48}
                  className={styles.logoImage}
                />
              </div>
              <h1 className={styles.brandName}>SALVIORIS</h1>
            </div>
            {isLoggedIn && (
              <div className={styles.userSection}>
                <span className={styles.userName}>Welcome, @{user?.username || user?.name || 'User'}</span>
                <Button
                  variant="healing"
                  size="default"
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  <LogOut className={styles.logoutIcon} />
                  Log Out
                </Button>
              </div>
            )}
          </div>
          <h2 className={styles.pageTitle}>
            Vent Till Your <span className={styles.highlight}>Heart&apos;s Content</span>
          </h2>
          <p className={styles.pageDescription}>
            This is your safe space. Express yourself freely, without judgment.
            {!isLoggedIn && " Your messages will be cleared when you close this window."}
          </p>
          
          {warningMessage && (
            <div className={`${styles.warningBanner} ${isBlocked ? styles.blockedBanner : ''}`}>
              <p>{warningMessage}</p>
              {!isBlocked && (
                <button
                  className={styles.closeWarningButton}
                  onClick={() => setWarningMessage(null)}
                  aria-label="Close warning"
                >
                  <X className={styles.closeIcon} />
                </button>
              )}
            </div>
          )}
          
          {isBlocked && (
            <div className={styles.blockedMessage}>
              <p>
                Your access has been temporarily restricted due to policy violations. 
                If you need help or believe this is an error, please contact support.
              </p>
            </div>
          )}
        </div>

        <div className={styles.chatContainer} ref={chatContainerRef}>
          <div className={styles.messagesArea} ref={messagesAreaRef}>
            {isLoading && (
              <div className={styles.loadingMessage}>Loading your messages...</div>
            )}

            {!isLoading && vents.length === 0 && (
              <div className={styles.emptyState}>
                <MessageSquare className={styles.emptyIcon} />
                <p>No messages yet. Start venting to express yourself!</p>
              </div>
            )}

            {isLoadingMore && (
              <div ref={loadingMoreRef} className={styles.loadingMore}>
                Loading more messages...
              </div>
            )}

            {vents.map((vent) => (
              <div key={vent.id} className={styles.message}>
                {vent.username && (
                  <div className={styles.messageAuthor}>
                    @{vent.username}
                  </div>
                )}
                <div className={styles.messageContent}>{vent.message}</div>
                <div className={styles.messageTime}>
                  {formatChatTime(vent.created_at)}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <textarea
              className={styles.messageInput}
              placeholder="Type your message here... (Press Enter to send)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={3}
              disabled={isBlocked}
            />
            <div className={styles.inputActions}>
              <Link
                href={isLoggedIn ? "/journaling" : "/signup?redirect=/journaling"}
              >
                <Button
                  variant="healing"
                  size="sm"
                  className={styles.journalCTAButton}
                >
                  {isLoggedIn ? "Open Journaling" : "Start Journaling"}
                </Button>
              </Link>
              <div className={styles.inputButtons}>
                <Button
                  onClick={() => setShowFeedbackModal(true)}
                  variant="default"
                  className={styles.feedbackButton}
                  title="Leave Feedback"
                >
                  <Star className={styles.feedbackIcon} />
                  <span className={styles.feedbackButtonText}>Leave Feedback</span>
                </Button>
                <Button
                  onClick={isLoggedIn ? handleSend : handleSendAsGuest}
                  disabled={!message.trim() || isSending || isBlocked}
                  variant="healing"
                  className={styles.sendButton}
                >
                  <Send className={styles.sendIcon} />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Prompt Popup for new users */}
      {showAuthPrompt && !isLoggedIn && (
        <div className={styles.modal} onClick={() => setShowAuthPrompt(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Save Your Messages Permanently</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAuthPrompt(false)}
                aria-label="Close"
              >
                <X className={styles.closeIcon} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Want to save your vent messages permanently? Sign in or create an account to keep your messages safe.
                <br /><br />
                You can continue as a guest, but your messages will be cleared when you close this window.
              </p>
              <div className={styles.modalActions}>
                <Link href="/signin">
                  <Button variant="healing" className={styles.modalButton}>
                    <LogIn className={styles.authIcon} />
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="healing" className={styles.modalButton}>
                    <UserPlus className={styles.authIcon} />
                    Sign Up
                  </Button>
                </Link>
                <Button
                  variant="healing"
                  className={styles.modalButton}
                  onClick={() => setShowAuthPrompt(false)}
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for when trying to send without login */}
      {showAuthModal && (
        <div className={styles.modal} onClick={() => setShowAuthModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Sign In to Save Your Messages</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAuthModal(false)}
                aria-label="Close"
              >
                <X className={styles.closeIcon} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                To save your vent messages permanently, please sign in or create an account.
                You can continue as a guest, but your messages will be cleared when you close this window.
              </p>
              <div className={styles.modalActions}>
                <Link href="/signin">
                  <Button variant="healing" className={styles.modalButton}>
                    <LogIn className={styles.authIcon} />
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="healing" className={styles.modalButton}>
                    <UserPlus className={styles.authIcon} />
                    Sign Up
                  </Button>
                </Link>
                <Button
                  variant="healing"
                  className={styles.modalButton}
                  onClick={() => {
                    setShowAuthModal(false);
                    handleSendAsGuest();
                  }}
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encouragement Modal */}
      {showEncouragementModal && (
        <div className={styles.modal} onClick={() => setShowEncouragementModal(false)}>
          <div className={`${styles.modalContent} ${styles.encouragementModalContent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.encouragementHeader}>
              <div className={styles.heartIconWrapper}>
                <Heart className={styles.encouragementHeart} />
              </div>
              <h3 className={styles.encouragementTitle}>You Are Heard & Supported</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowEncouragementModal(false)}
                aria-label="Close"
              >
                <X className={styles.closeIcon} />
              </button>
            </div>
            <div className={styles.encouragementBody}>
              <p className={styles.encouragementText}>
                We see you pouring your heart out, and we want you to know that <strong>you are heard</strong>. 
                This is your safe space—a place where you can express yourself freely, without judgment, 
                without fear, and without reservation.
              </p>
              <p className={styles.encouragementText}>
                Every word you share matters. Every feeling you express is valid. This is a judgment-free zone 
                where you can vent, process, and release whatever is weighing on your heart.
              </p>
              <p className={styles.encouragementText}>
                Take your time. Write as much as you need. Send as many messages as you want. We&apos;re here 
                to listen, to support, and to remind you that you&apos;re not alone in this journey.
              </p>
              <div className={styles.encouragementFooter}>
                <p className={styles.encouragementClosing}>
                  With love and understanding,<br />
                  <strong>The SALVIORIS Team</strong>
                </p>
              </div>
              <Button
                variant="healing"
                className={styles.encouragementButton}
                onClick={() => setShowEncouragementModal(false)}
              >
                Continue Venting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div 
          className={styles.modal} 
          onClick={() => {
            // Allow closing by clicking outside
            if (!isSubmittingFeedback) {
              setShowFeedbackModal(false);
            }
          }}
        >
          <div 
            className={`${styles.modalContent} ${styles.feedbackModalContent}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.feedbackHeaderContent}>
                <Star className={styles.feedbackHeaderIcon} />
                <h3>We&apos;d Love Your Feedback!</h3>
              </div>
              <button
                className={styles.closeButton}
                onClick={() => setShowFeedbackModal(false)}
                aria-label="Close"
                disabled={isSubmittingFeedback}
              >
                <X className={styles.closeIcon} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {feedbackSubmitted ? (
                <div className={styles.feedbackSuccess}>
                  <CheckCircle className={styles.successIcon} />
                  <p className={styles.successMessage}>Thank you for your feedback!</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className={styles.feedbackForm}>
                  <p className={styles.feedbackSubtitle}>
                    We know you&apos;re going through a lot right now, and we&apos;re here for you. 
                    If you can spare just a minute, we&apos;d love to know where we can improve so you can feel much better. 
                    Your voice matters, and with your help, we can make SALVIORIS a more supportive space for everyone.
                  </p>
                  
                  {feedbackError && (
                    <div className={styles.errorMessage}>
                      {feedbackError}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label htmlFor="feedback" className={styles.label}>
                      Your Feedback
                    </label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => {
                        setFeedback(e.target.value);
                        setFeedbackError(null);
                      }}
                      placeholder="Tell us what you think... What can we improve? What features would you like to see?"
                      rows={6}
                      className={styles.feedbackTextarea}
                    />
                    <p className={styles.helperText}>
                      Optional. Be as detailed as you&apos;d like!
                    </p>
                  </div>

                  <div className={styles.feedbackActions}>
                    <Button
                      type="submit"
                      variant="default"
                      disabled={isSubmittingFeedback}
                      className={styles.leaveFeedbackButton}
                    >
                      {isSubmittingFeedback ? "Submitting..." : "Leave Feedback"}
                    </Button>
                  </div>

                  <p className={styles.privacyNote}>
                    <strong>Note:</strong> Your feedback is anonymous and will only be used to improve our services.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

