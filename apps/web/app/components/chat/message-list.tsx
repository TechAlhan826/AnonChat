import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { useSocket } from "../../hooks/use-socket";
import { useAuth } from "../../hooks/use-auth";

interface Message {
  id: string;
  content: string;
  userId?: string;
  guestId?: string;
  messageType: string;
  createdAt: string;
}

interface Room {
  id: string;
  code: string;
  name?: string;
}

interface MessageListProps {
  room: Room;
}

export function MessageList({ room }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isGuest } = useAuth();
  const { on, joinRoom, leaveRoom } = useSocket();

  const { data: initialMessages } = useQuery({
    queryKey: ["/api/rooms", room.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${room.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Join room on mount
    const userData = user || { name: "Guest", id: "guest" };
    joinRoom(room.id, userData);

    // Set up socket listeners
    const removeNewMessageListener = on("new-message", (data: any) => {
      setMessages(prev => [...prev, data.message]);
    });

    const removeUserJoinedListener = on("user-joined", (data: any) => {
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `${data.user.name || "Someone"} joined the chat`,
        messageType: "system",
        createdAt: data.timestamp,
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    const removeUserLeftListener = on("user-left", (data: any) => {
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `${data.user.name || "Someone"} left the chat`,
        messageType: "system",
        createdAt: data.timestamp,
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    const removeTypingListener = on("user-typing", (data: any) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.user.name || data.user.id);
        } else {
          newSet.delete(data.user.name || data.user.id);
        }
        return newSet;
      });

      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user.name || data.user.id);
          return newSet;
        });
      }, 3000);
    });

    return () => {
      // Clean up listeners
      removeNewMessageListener();
      removeUserJoinedListener();
      removeUserLeftListener();
      removeTypingListener();
      
      // Leave room
      leaveRoom(room.id, userData);
    };
  }, [room.id, user, on, joinRoom, leaveRoom]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const isOwnMessage = (message: Message) => {
    if (user) {
      return message.userId === user.id;
    }
    // For guests, we'll need to track guest ID
    return false;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="message-list">
      {messages.map((message) => {
        if (message.messageType === "system") {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="bg-muted px-3 py-1 rounded-full">
                <p className="text-xs text-muted-foreground" data-testid="system-message">
                  {message.content}
                </p>
              </div>
            </div>
          );
        }

        const isOwn = isOwnMessage(message);
        const senderName = message.userId ? "User" : (message.guestId || "Anonymous");

        return (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${isOwn ? "justify-end" : ""}`}
            data-testid={`message-${message.id}`}
          >
            {!isOwn && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                  {getInitials(senderName)}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
              <div className={`flex items-center space-x-2 mb-1 ${isOwn ? "justify-end" : ""}`}>
                <span className="text-sm font-medium text-foreground" data-testid="message-sender">
                  {isOwn ? "You" : senderName}
                </span>
                <span className="text-xs text-muted-foreground" data-testid="message-time">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <div
                className={`rounded-lg p-3 inline-block max-w-xs lg:max-w-md ${
                  isOwn
                    ? "bg-primary text-primary-foreground message-bubble sent"
                    : "bg-card border border-border message-bubble"
                }`}
              >
                <p className="text-sm" data-testid="message-content">
                  {message.content}
                </p>
              </div>
            </div>

            {isOwn && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user ? getInitials(user.name) : "Y"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}

      {/* Typing Indicators */}
      {Array.from(typingUsers).map((userName) => (
        <div key={`typing-${userName}`} className="flex items-start space-x-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {userName}
              </span>
              <span className="text-xs text-muted-foreground">is typing...</span>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 message-bubble">
              <div className="typing-indicator flex items-center space-x-1">
                <div className="typing-dot w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="typing-dot w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                <div className="typing-dot w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
