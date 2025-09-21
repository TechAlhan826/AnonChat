import { useState } from "react";
import { Plus, Search, Settings, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

interface Room {
  id: string;
  code: string;
  name?: string;
  type: string;
  memberCount: number;
  lastMessage?: any;
}

interface SidebarProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  isLoading: boolean;
}

export function Sidebar({ rooms, selectedRoomId, onSelectRoom, isLoading }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const filteredRooms = rooms.filter((room) =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: string) => {
    const now = new Date();
    const messageTime = new Date(date);
    const diff = now.getTime() - messageTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">My Chats</h2>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-create-room"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading chats...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No chats found</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room.id}
              className={`p-4 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
                selectedRoomId === room.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelectRoom(room.id)}
              data-testid={`room-item-${room.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  room.type === 'group' ? 'bg-primary' : 'bg-accent'
                }`}>
                  {room.type === 'group' ? (
                    <Users className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <User className="w-6 h-6 text-accent-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground truncate" data-testid="text-room-name">
                      {room.name || `${room.type === 'group' ? 'Group' : 'Chat'} ${room.code}`}
                    </h3>
                    {room.lastMessage && (
                      <span className="text-xs text-muted-foreground" data-testid="text-last-message-time">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate" data-testid="text-last-message">
                      {room.lastMessage.content}
                    </p>
                  )}
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground room-code font-mono" data-testid="text-room-code">
                      {room.code}
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      room.memberCount > 0 
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : "bg-muted text-muted-foreground"
                    }`} data-testid="text-member-count">
                      {room.memberCount} online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10 online-indicator">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground" data-testid="text-user-name">
              {user?.name || "User"}
            </h4>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
