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

export const Sidebar = ({ rooms, selectedRoomCode, onSelectRoom, isLoading }: SidebarProps) => {
  if (isLoading) return <div>Loading rooms...</div>;

  return (
    <aside className="w-64 bg-gray-100 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">My Rooms</h2>
      {rooms.length === 0 ? <p>No rooms joined</p> : rooms.map(room => (
        <motion.button
          key={room.code}
          onClick={() => onSelectRoom(room.code)}
          className={`w-full text-left p-2 mb-2 rounded ${selectedRoomCode === room.code ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="font-semibold">{room.type.toUpperCase()} - {room.code}</div>
          <div className="text-sm">Members: {room.memberCount}</div>
          <div className="text-sm truncate">{room.lastMessage || 'No messages'}</div>
        </motion.button>
      ))}
    </aside>
  );
};