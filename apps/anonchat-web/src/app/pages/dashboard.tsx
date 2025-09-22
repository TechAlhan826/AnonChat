'use client'
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "../components/chat/sidebar";
import { MessageList } from "../components/chat/message-list";
import { MessageInput } from "../components/chat/message-input";
import { useAuth } from "../hooks/use-auth";
import { auth } from "../lib/auth";

interface Room {
  id: string;
  code: string;
  name?: string;
  type: string;
  memberCount: number;
  lastMessage?: any;
}

export default function Dashboard() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["/api/rooms/my-rooms"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = auth.getToken();
      const res = await fetch("/api/rooms/my-rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

  const { data: selectedRoom } = useQuery({
    queryKey: ["/api/rooms", selectedRoomId],
    enabled: !!selectedRoomId,
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${selectedRoomId}`);
      if (!res.ok) throw new Error("Failed to fetch room");
      return res.json();
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/auth/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen animate-fade-in">
      <Sidebar
        rooms={rooms || []}
        selectedRoomId={selectedRoomId}
        onSelectRoom={setSelectedRoomId}
        isLoading={isLoadingRooms}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedRoomId && selectedRoom ? (
          <>
            <MessageList room={selectedRoom.room} />
            <MessageInput roomId={selectedRoomId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Select a chat to start messaging
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
