'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";
import Cookies from 'js-cookie';
import { Sidebar } from "../components/chat/sidebar";
import { MessageList } from "../components/chat/message-list";
import { MessageInput } from "../components/chat/message-input";

interface Room {
  _id: string;  // Backend uses _id
  code: string;
  type: 'p2p' | 'group';
  memberCount: number;
  lastMessage: string | null;
  // Add more if backend returns
}

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);  // Use code for selection
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);  // Full room data
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token'); //Cookies.get('token');
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
        setRooms(data);  // Assume array of rooms
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load rooms", variant: "destructive" });
        if (err.message.includes("Invalid token")) {
          Cookies.remove('token');
          router.push("/auth/login");
        }
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [router, toast]);

  useEffect(() => {
    if (!selectedRoomCode) return;

    const fetchSelectedRoom = async () => {
      const token = Cookies.get('token');
      try {
        const res = await fetch(`http://localhost:5000/api/rooms/${selectedRoomCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch room");
        const data = await res.json();
        setSelectedRoom(data);  // {room, memberCount, members}
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to load room", variant: "destructive" });
      }
    };

    fetchSelectedRoom();
  }, [selectedRoomCode, toast]);

  return (
    <div className="flex h-screen animate-fade-in">
      <Sidebar
        rooms={rooms}
        selectedRoomId={selectedRoomCode}
        onSelectRoom={setSelectedRoomCode}
        isLoading={isLoadingRooms}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedRoomCode && selectedRoom ? (
          <>
            <MessageList room={selectedRoom.room} />
            <MessageInput roomId={selectedRoom.room.code} />  // Use code or _id if backend expects id
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