'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MessageList } from "../../components/chat/message-list";
import { MessageInput } from "../../components/chat/message-input";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { LogOut } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import Cookies from 'js-cookie';

export default function ChatRoom() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const { toast } = useToast();
  const [hasJoined, setHasJoined] = useState(false);
  const [roomData, setRoomData] = useState<{ room: any; memberCount: number; members: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let token = localStorage.getItem('token'); //Cookies.get('token');
    const joinAndFetch = async () => {
      setIsLoading(true);
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        else {
          // Create guest session
          const guestRes = await fetch("http://localhost:5000/api/rooms/create-guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName: `Guest_${Math.random().toString(36).substring(2, 7)}` }),
          });
          if (!guestRes.ok) throw new Error("Failed to create guest session");
          const guestData = await guestRes.json();
          token = guestData.sessionToken;
          localStorage.setItem('token', token);
          //Cookies.set('token', token, { expires: 1, secure: true, sameSite: 'strict' });
        }

        // Join
        const joinRes = await fetch("http://localhost:5000/api/rooms/join", {
          method: "POST",
          headers,
          body: JSON.stringify({ code: code.toUpperCase() }),
        });
        if (!joinRes.ok) {
          const errorData = await joinRes.json();
          throw new Error(errorData.message || "Failed to join room");
        }

        setHasJoined(true);

        // Fetch room details
        const roomRes = await fetch(`http://localhost:5000/api/rooms/${code.toUpperCase()}`, { headers });
        if (!roomRes.ok) throw new Error("Failed to fetch room details");
        const data = await roomRes.json();
        setRoomData(data);

        toast({ title: "Success", description: `Joined room ${code.toUpperCase()}!` });
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to join/load room", variant: "destructive" });
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    joinAndFetch();
  }, [code, toast, router]);

  const handleLeaveRoom = async () => {
    const token = Cookies.get('token');
    if (!token) return router.push("/");

    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${code}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to leave");
      toast({ title: "Success", description: "Left room successfully" });
      router.push("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to leave room", variant: "destructive" });
    }
  };

  if (isLoading || !hasJoined) {
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

  if (!roomData || !roomData.room) {
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
              {roomData.room.name || `Room ${roomData.room.code}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              <span data-testid="text-room-code">
                {roomData.room.code}
              </span>
              {" • "}
              <span data-testid="text-member-count">
                {roomData.memberCount} member{roomData.memberCount !== 1 ? 's' : ''} online
              </span>
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeaveRoom}
            className="flex items-center space-x-2"
            data-testid="button-leave-room"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <MessageList room={roomData.room} />
        <MessageInput roomId={roomData.room.code} />
      </div>
    </div>
  );
}