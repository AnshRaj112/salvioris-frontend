"use client";

import { useState } from "react";
import { Button } from "../ui/ChatButton";
import { Card, CardContent, CardHeader } from "../ui/ChatCard";
import { Input } from "../ui/input";
import { Send, Phone, Video, MoreVertical, Heart } from "lucide-react";
import styles from "./scss/ChatInterface.module.scss";
import { formatChatTime } from "@/app/lib/time";

const ChatInterface = () => {
  const [message, setMessage] = useState("");
  
  const messages = [
    {
      id: 1,
      sender: "therapist",
      content: "Hello! I'm so glad you decided to reach out today. How are you feeling right now?",
      time: "2:30 PM",
      timestamp: new Date().toISOString(),
      senderName: "Dr. Sarah Chen"
    },
    {
      id: 2,
      sender: "user",
      content: "Hi Dr. Chen. I've been feeling really overwhelmed lately with work and everything going on in my life.",
      time: "2:32 PM",
      timestamp: new Date().toISOString(),
    },
    {
      id: 3,
      sender: "therapist",
      content: "I hear you, and it's completely understandable to feel overwhelmed. You're not alone in this. Can you tell me a bit more about what specifically has been weighing on your mind?",
      time: "2:33 PM",
      timestamp: new Date().toISOString(),
      senderName: "Dr. Sarah Chen"
    },
    {
      id: 4,
      sender: "user",
      content: "It's mainly the pressure at work. I feel like I'm constantly behind and can't catch up. It's affecting my sleep and I find myself worrying all the time.",
      time: "2:35 PM",
      timestamp: new Date().toISOString(),
    },
    {
      id: 5,
      sender: "therapist",
      content: "Thank you for sharing that with me. Work-related stress can definitely impact our overall well-being, including sleep patterns. Let's work together to develop some coping strategies. Have you noticed any particular triggers that make the anxiety worse?",
      time: "2:37 PM",
      timestamp: new Date().toISOString(),
      senderName: "Dr. Sarah Chen"
    }
  ];

  return (
    <section className={`${styles.chatInterface} ${styles.comingSoonSection}`}>
      <div className={styles.comingSoonBadge}>Coming Soon</div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}> 
            Real-time
            <span className={styles.titleHighlight}>
              Support
            </span>
          </h2>
          <p className={styles.subtitle}>
            Connect instantly with licensed therapists through secure, confidential messaging
          </p>
        </div>
        
        <Card className={styles.chatCard}>
          {/* Chat Header */}
          <CardHeader className={styles.chatHeader}>
            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <div className={styles.avatarContainer}>
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=50&h=50&fit=crop&crop=face"
                    alt="Dr. Sarah Chen"
                    className={styles.avatar}
                  />
                  <div className={styles.statusIndicator}></div>
                </div>
                <div className={styles.headerInfo}>
                  <h3>Dr. Sarah Chen</h3>
                  <p>Online • Anxiety & Depression Specialist</p>
                </div>
              </div>
              <div className={styles.headerActions}>
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Messages */}
          <CardContent className="p-0">
            <div className={styles.messagesContainer}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageWrapper} ${
                    msg.sender === 'user' ? styles.userMessage : styles.therapistMessage
                  }`}
                >
                  <div
                    className={`${styles.messageBubble} ${
                      msg.sender === 'user' ? styles.user : styles.therapist
                    }`}
                  >
                    {msg.sender === 'therapist' && (
                      <p className={styles.senderName}>{msg.senderName}</p>
                    )}
                    <p className={styles.messageContent}>{msg.content}</p>
                    <p
                      className={`${styles.messageTime} ${
                        msg.sender === "user" ? styles.user : styles.therapist
                      }`}
                    >
                      {msg.timestamp ? formatChatTime(msg.timestamp) : msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <div className={styles.inputField}>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message... Remember, this is a safe space"
                    className={styles.input}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // Handle send message
                        setMessage("");
                      }
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={styles.heartButton}
                  >
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Button 
                  variant="soothing" 
                  size="icon" 
                  className={styles.sendButton}
                  onClick={() => setMessage("")}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className={styles.privacyNote}>
                Your conversation is encrypted and completely confidential
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ChatInterface;