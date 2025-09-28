'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";
import Cookies from 'js-cookie';
import { Sidebar } from "../components/chat/sidebar";
import { MessageList } from "../components/chat/message-list";
import { MessageInput } from "../components/chat/message-input";
import { jwtDecode } from "jwt-decode";

interface Decoded { userId: string; }

interface Room {
  _id: string;
  code: string;
  type: 'p2p' | 'group';
  memberCount: number;
  lastMessage: string | null;
  createdBy: string;  // For delete check
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();
  const token = Cookies.get('token');
  const decoded: Decoded | null = token ? jwtDecode(token) : null;
  const userId = decoded?.userId || '';

  useEffect(() => {
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const fetchRooms = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/rooms/my-rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch rooms");
        const data = await res.json();
        setRooms(data);
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load rooms", variant: "destructive" });
        if (err.message.includes("Invalid token")) {
          Cookies.remove('token');
          localStorage.removeItem('token_fallback');
          router.push("/auth/login");
        }
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [router, toast, token]);

  useEffect(() => {
    if (!selectedRoomCode) return;

    const fetchSelectedRoom = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/rooms/${selectedRoomCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch room");
        const data = await res.json();
        setSelectedRoom(data);
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load room", variant: "destructive" });
      }
    };

    fetchSelectedRoom();
  }, [selectedRoomCode, token, toast]);

  const deleteRoom = async (code: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/${code}/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setRooms(prev => prev.filter(r => r.code !== code));
      toast({ description: "Room deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoadingRooms) {
    return <div className="flex-1 flex items-center justify-center">Loading rooms...</div>;
  }

  return (
    <div className="flex h-screen animate-fade-in">
      <Sidebar
        rooms={rooms}
        selectedRoomId={selectedRoomCode}
        onSelectRoom={setSelectedRoomCode}
        isLoading={isLoadingRooms}
        onDeleteRoom={deleteRoom}  // Pass to sidebar for button
        userId={userId}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedRoomCode && selectedRoom ? (
          <>
            <MessageList room={selectedRoom.room} />
            <MessageInput roomId={selectedRoom.room.code} />
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