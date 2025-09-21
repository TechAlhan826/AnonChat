import { useState, useRef, useEffect } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";

interface MessageInputProps {
  roomId: string;
}

export function MessageInput({ roomId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, sendTyping } = useSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim()) {
      const userData = user || { name: "Guest", id: "guest" };
      sendMessage(
        roomId,
        message.trim(),
        user?.id,
        !user ? "guest" : undefined,
        userData
      );
      setMessage("");
      
      // Clear typing indicator
      if (isTyping) {
        setIsTyping(false);
        sendTyping(roomId, userData, false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    const userData = user || { name: "Guest", id: "guest" };
    
    // Send typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTyping(roomId, userData, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(roomId, userData, false);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-card border-t border-border p-4">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={handleInputChange}
            className="pr-12"
            data-testid="input-message"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
            data-testid="button-emoji"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>
        <Button
          type="submit"
          disabled={!message.trim()}
          className="flex items-center space-x-2 px-6"
          data-testid="button-send"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
    </div>
  );
}
