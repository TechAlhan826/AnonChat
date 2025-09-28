import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../../../context/SocketProvider'; // '../../hooks/use-socket';
import Cookies from 'js-cookie';
import DOMPurify from 'dompurify';

interface MessageListProps {
  room: any;  // From roomData.room
}

export const MessageList = ({ room }: MessageListProps) => {
  const { messages, typingUsers } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = Cookies.get('token');
    const fetchHistory = async () => {
      if (!room.preserveHistory) return;
      try {
        const res = await fetch(`http://localhost:5000/api/rooms/${room.code}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch history");
        const history = await res.json();
        // Append to messages via set, but since socket has state, assume provider merges
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, [room.code]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-2 ${msg.sender === 'System' ? 'text-gray-500' : ''}`}
        >
          <span className="font-bold">{msg.sender}:</span> <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }} />
          <span className="text-xs text-gray-400 ml-2">{msg.timestamp}</span>
        </motion.div>
      ))}
      {typingUsers.length > 0 && (
        <div className="text-sm text-gray-500">{typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...</div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};