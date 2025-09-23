'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { MessageList } from "../../components/chat/message-list";
import { MessageInput } from "../../components/chat/message-input";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";

export default function ChatRoom() {
  const { code } = useParams();
  const router = useRouter();
  const { isGuest, createGuestSession } = useAuth();
  const { toast } = useToast();
  const [hasJoined, setHasJoined] = useState(false);

  // Join room on component mount
  useEffect(() => {
    const joinRoom = async () => {
      if (!code || hasJoined) return;

      try {
        // Create guest session if needed
        if (!localStorage.getItem("guestToken") && !localStorage.getItem("authToken")) {
          await createGuestSession();
        }

        const token = localStorage.getItem("authToken") || localStorage.getItem("guestToken");
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch("/api/rooms/join", {
          method: "POST",
          headers,
          body: JSON.stringify({ code: code.toUpperCase() }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message);
        }

        setHasJoined(true);
        toast({
          title: "Success",
          description: `Joined room ${code.toUpperCase()}!`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to join room",
          variant: "destructive",
        });
        router.push("/");
      }
    };

    joinRoom();
  }, [code, hasJoined, createGuestSession, toast, setLocation]);

  const { data: roomData } = useQuery({
    queryKey: ["/api/rooms/by-code", code],
    enabled: hasJoined && !!code,
    queryFn: async () => {
      const res = await fetch(`/api/rooms/by-code/${code}`);
      if (!res.ok) throw new Error("Failed to fetch room");
      return res.json();
    },
  });

  const handleLeaveRoom = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("guestToken");
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      await fetch(`/api/rooms/${roomData?.room?.id}/leave`, {
        method: "POST",
        headers,
      });

      toast({
        title: "Success",
        description: "Left room successfully",
      });
      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
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
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h3 className="text-lg font-semibold text-foreground" data-testid="text-room-name">
              {roomData.room.name || `Room ${roomData.room.code}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="room-code font-mono" data-testid="text-room-code">
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
        <MessageInput roomId={roomData.room.id} />
      </div>
    </div>
  );
}
