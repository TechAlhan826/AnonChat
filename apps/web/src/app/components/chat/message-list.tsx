import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { useSocket } from "../../hooks/use-socket";
import { useToast } from "../../hooks/use-toast";
import Cookies from 'js-cookie';

interface Message {
  id: string;
  content: string;
  sender: { id: string; displayName: string; isGuest: boolean };
  messageType: string;
  createdAt: string;
}

interface Room {
  _id: string;
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
  const { on, joinRoom, leaveRoom } = useSocket();
  const { toast } = useToast();
  const userId = Cookies.get('userId');  // Assume stored on login; or from token decode.
  const guestId = Cookies.get('guestId');  // Set on guest create.

  useEffect(() => {
    const fetchInitialMessages = async () => {
      const token = Cookies.get('token');
      try {
        const res = await fetch(`http://localhost:5000/api/rooms/${room.code}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data.map((m: any) => ({ ...m, sender: { id: m.userId || m.guestId, displayName: "Anonymous", isGuest: !!m.guestId } })));  // Mock sender; backend add if needed.
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    };

    fetchInitialMessages();
  }, [room.code, toast]);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Join room on mount
    const userData = { id: userId || guestId, name: "User" };  // Adjust
    joinRoom(room.code, userData);  // Assume useSocket has joinRoom with code, data

    const removeMessageListener = on("message", (data: any) => {  // Updated event
      setMessages(prev => [...prev, data]);
    });

    const removeUserJoinedListener = on("user-joined", (data: any) => {
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        content: `${data.user.displayName || "Someone"} joined the chat`,
        messageType: "system",
        sender: { id: '', displayName: '', isGuest: false },
        createdAt: data.timestamp,
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    // Similar for left, typing

    return () => {
      removeMessageListener();
      // Remove others
      leaveRoom(room.code, userData);
    };
  }, [room.code, on, joinRoom, leaveRoom, userId, guestId]);

  // ... rest as is, with isOwnMessage: (message) => message.sender.id === (userId || guestId)

  const isOwnMessage = (message: Message) => message.sender.id === (userId || guestId);

  // Rest of code...


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
