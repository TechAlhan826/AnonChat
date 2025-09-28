'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MessageList } from "../../components/chat/message-list";
import { MessageInput } from "../../components/chat/message-input";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { LogOut, User, Users, Check } from "lucide-react";  // Added icons
import { useToast } from "../../hooks/use-toast";
import { useSocket } from "../../../context/SocketProvider";  // From context
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";  // npm i jwt-decode @types/jwt-decode

interface DecodedToken { type?: 'guest'; id: string; }  // Simple

export default function ChatRoom() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { toast } = useToast();
  const { sendMessage, messages, joinRoom, leaveRoom, sendTyping, typingUsers, isConnected } = useSocket();
  const [hasJoined, setHasJoined] = useState(false);
  const [roomData, setRoomData] = useState<any>(null);
  const [input, setInput] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userId, setUserId] = useState('');
  const [preserve, setPreserve] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const roomMessages = messages[code] || [];
  const roomTyping = typingUsers[code] || [];

  useEffect(() => {
    const token = localStorage.getItem('token'); //Cookies.get('token');
    if (!token) {
      router.push('/');
      return;
    }
    const decoded: DecodedToken = jwtDecode(token);
    setIsGuest(decoded.type === 'guest');
    setUserId(decoded.id);

    const join = async () => {
      try {
        joinRoom(code);
        const res = await fetch(`http://localhost:5000/api/rooms/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRoomData(data);
        setPreserve(data.room.preserveHistory);
        setIsCreator(data.room.createdBy === decoded.id);  // Check creator

        // Fetch history if preserve
        if (data.room.preserveHistory) {
          const histRes = await fetch(`http://localhost:5000/api/rooms/${code}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (histRes.ok) {
            const hist = await histRes.json();
            // Set to messages[code]; but since context, assume append or replace if empty.
            if (!messages[code]?.length) {
              hist.forEach((m: Message) => {
                onMessageReceived({message: m.content, roomCode: code, sender: m.sender, timestamp: m.timestamp});  // Simulate to append
              });
            }
          }
        }

        setHasJoined(true);
      } catch (err: any) {
        console.log(err);
        toast({ title: "Error", description: err.message, variant: "destructive" });
        router.push("/");
      }
    };

    if (isConnected) join();
    else toast({ description: "Connecting..." });

  }, [code, isConnected, joinRoom, toast, router, messages]);

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
    sendMessage(input, code);
    setInput('');
  };

  const handlePreserveChange = async (checked: boolean) => {
    const token = Cookies.get('token');
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${code}/preserve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    leaveRoom(code);
    await fetch(`http://localhost:5000/api/rooms/${code}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    });
    toast({ description: "Left room" });
    router.push("/");
  };

  if (!hasJoined) return <div>Loading...</div>;  // Simplified

  if (!roomData) return <div>Loading room...</div>;

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
            <Check
              checked={preserve}
              onCheckedChange={handlePreserveChange}
              className="mr-4"
            >Preserve History</Check>
          )}
          <Button variant="destructive" size="sm" onClick={handleLeaveRoom} data-testid="button-leave-room">
            <LogOut className="w-4 h-4 mr-2" /> Leave
          </Button>
        </div>
      </div>
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <MessageList room={roomData.room} messages={roomMessages} currentUserId={userId} />  // Pass to handle me/others align
        <MessageInput value={input} onChange={setInput} onSend={handleSend} disabled={!isConnected} />
      </div>
    </div>
  );
}