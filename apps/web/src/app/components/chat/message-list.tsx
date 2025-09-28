import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

interface Message {
  content: string;
  sender: string;
  timestamp: string;
}

interface MessageListProps {
  room: any;
  messages: Message[];
  currentUserId: string;
  currentUserName: string;
}

function getColorForSender(sender: string) {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 70%)`;
  return color;
}

export const MessageList = ({ room, messages, currentUserId, currentUserName }: MessageListProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => {
        const isSent = msg.sender === currentUserName;
        const isSystem = msg.sender === 'system';
        const bgColor = isSystem ? 'bg-gray-200 text-gray-800' : isSent ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800';
        const align = isSent ? 'ml-auto' : 'mr-auto';
        const senderColor = getColorForSender(msg.sender);

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[80%] rounded-lg p-3 shadow ${bgColor} ${align}`}
          >
            {!isSystem && room.type === 'group' && !isSent && (
              <span style={{ color: senderColor }} className="font-bold block mb-1">{msg.sender}</span>
            )}
            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
            <span className="text-xs opacity-70 block mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </motion.div>
        );
      })}
    </div>
  );
};