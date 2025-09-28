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
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export const MessageList = ({ room, messages, currentUserId, currentUserName }: MessageListProps) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0, listRef.current.scrollHeight);
    }
  }, [messages]);

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, i) => {
        const isSent = msg.sender === currentUserName;
        const isSystem = msg.sender === 'system';
        
        if (isSystem) {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs inline-block">
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
              </div>
            </motion.div>
          );
        }

        const senderColor = getColorForSender(msg.sender);
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
              isSent 
                ? 'bg-blue-500 text-white rounded-br-sm' 
                : 'bg-gray-100 text-gray-800 rounded-bl-sm border'
            }`}>
              {!isSent && room.type === 'group' && (
                <div className="mb-1">
                  <span 
                    style={{ color: senderColor }} 
                    className="font-semibold text-sm"
                  >
                    {msg.sender}
                  </span>
                </div>
              )}
              <div className="break-words">
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
              </div>
              <div className={`text-xs mt-1 ${
                isSent ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};