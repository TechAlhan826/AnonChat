import { motion } from 'framer-motion';
import { Button } from '../ui/button';

interface Room {
  _id: string;
  code: string;
  type: 'p2p' | 'group';
  memberCount: number;
  lastMessage: string | null;
}

interface SidebarProps {
  rooms: Room[];
  selectedRoomCode: string | null;
  onSelectRoom: (code: string) => void;
  isLoading: boolean;
}

// Example; add delete button if room.createdBy === userId
export function Sidebar({ rooms, selectedRoomId, onSelectRoom, isLoading, onDeleteRoom, userId }) {
  if (isLoading) return <div>Loading...</div>;

  return (
    <aside className="w-64 bg-gray-100 p-4">
      <h2>My Rooms</h2>
      {rooms.map(room => (
        <div key={room.code}>
          <button onClick={() => onSelectRoom(room.code)}>
            {room.type} - {room.code} ({room.memberCount})
          </button>
          {room.createdBy === userId && <Button onClick={() => onDeleteRoom(room.code)}>Delete</Button>}
        </div>
      ))}
    </aside>
  );
}