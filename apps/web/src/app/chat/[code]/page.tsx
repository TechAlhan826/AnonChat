'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MessageList } from "../../components/chat/message-list";
import { MessageInput } from "../../components/chat/message-input";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { LogOut, User, Users } from "lucide-react";
import { Checkbox } from "../../components/ui/checkbox";
import { useToast } from "../../hooks/use-toast";
import { useSocket } from "../../../context/SocketProvider";
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  type?: 'guest';
  id: string;
  name?: string;
  userId?: string;
}

export default function ChatRoom() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { toast } = useToast();
  const { sendMessage, addMessage, messages, joinRoom, leaveRoom, sendTyping, typingUsers, isConnected } = useSocket();
  const [hasJoined, setHasJoined] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [preserve, setPreserve] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const roomMessages = messages[code] || [];
  const roomTyping = typingUsers[code] || [];

  useEffect(() => {
    const token:string = localStorage.getItem('token') as string || Cookies.get('token') as string;
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const decoded: DecodedToken = jwtDecode(token);
      setUser(decoded);
      setIsGuest(decoded.type === 'guest');

      const join = async () => {
        try {
          joinRoom(code);
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
          const res = await fetch(`${backendUrl}/api/rooms/${code}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const errorData = await res.json();
            if (errorData.message.includes('Invalid token')) {
              Cookies.remove('token');
              router.push("/auth/login");
              return;
            }
            throw new Error(errorData.message);
          }
          const data = await res.json();
          setRoomData(data);
          setPreserve(data.room.preserveHistory);
          setIsCreator(data.room.createdBy === decoded.id || data.room.createdBy === decoded.userId);

          if (data.room.preserveHistory) {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
            const histRes = await fetch(`${backendUrl}/api/rooms/${code}/messages`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (histRes.ok) {
              const hist = await histRes.json();
              hist.forEach((m: any) => {
                addMessage({ content: m.content, sender: m.sender || 'Unknown', timestamp: m.createdAt }, code);
              });
            }
          }
          setHasJoined(true);
        } catch (err: any) {
          toast({ title: "Error", description: err.message, variant: "destructive" });
          router.push("/dashboard");
        }
      };

      if (isConnected) {
        join();
      } else {
        toast({ description: "Connecting..." });
      }
    } catch (error) {
      console.error('Token decode error:', error);
      Cookies.remove('token');
      router.push('/auth/login');
    }
  }, [code, isConnected, joinRoom, toast, router, addMessage]);

  useEffect(() => {
    if (input && !isTypingLocal) {
      setIsTypingLocal(true);
      sendTyping(true, code);
      const timer = setTimeout(() => {
        setIsTypingLocal(false);
        sendTyping(false, code);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [input, isTypingLocal, sendTyping, code]);

  const handleSend = () => {
    if (!input.trim() || !isConnected) return;
    
    // Only send the message via socket, don't add locally
    // The socket will handle adding it back via the message event
    sendMessage(input, code);
    setInput('');
  };

  const handlePreserveChange = async (checked: boolean) => {
    const token = Cookies.get('token');
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const res = await fetch(`${backendUrl}/api/rooms/${code}/preserve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preserve: checked }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPreserve(checked);
      toast({ description: `History preserve ${checked ? 'enabled' : 'disabled'}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleLeaveRoom = async () => {
    const token = Cookies.get('token');
    try {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  await fetch(`${backendUrl}/api/rooms/${code}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      leaveRoom(code);
      toast({ description: "Left room" });
      router.push("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Joining room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col animate-fade-in">
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold text-foreground" data-testid="text-room-name">
              {roomData.room.name || `Room ${roomData.room.code}`} {roomData.room.type === 'p2p' ? <User className="inline w-4 h-4" /> : <Users className="inline w-4 h-4" />} {isGuest ? '(Guest)' : '(Logged)'}
            </h3>
            <p className="text-sm text-muted-foreground">
              <span data-testid="text-room-code">{roomData.room.code}</span> • <span data-testid="text-member-count">{roomData.memberCount} members</span>
              {roomTyping.length > 0 && ` • ${roomTyping.join(', ')} typing...`}
            </p>
          </div>
          {isCreator && (
            <label className="flex items-center space-x-2">
              <span className="text-sm">Preserve</span>
              <Checkbox checked={preserve} onCheckedChange={handlePreserveChange} />
            </label>
          )}
          <Button variant="destructive" size="sm" onClick={handleLeaveRoom} data-testid="button-leave-room">
            <LogOut className="w-4 h-4 mr-2" /> Leave
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <MessageList 
          room={roomData.room} 
          messages={roomMessages} 
          currentUserId={user?.id || user?.userId || ''} 
          currentUserName={user?.name || 'Guest'} 
        />
        <MessageInput 
          roomId={code} 
          value={input} 
          onChange={setInput} 
          onSend={handleSend} 
          disabled={!isConnected} 
        />
      </div>
    </div>
  );
}