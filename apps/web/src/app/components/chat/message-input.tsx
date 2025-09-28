import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSocket } from '../../../context/SocketProvider'; // '../../hooks/use-socket';

interface MessageInputProps {
  roomId: string;  // code
}

export const MessageInput = ({ roomId }: MessageInputProps) => {
  const { sendMessage, startTyping, stopTyping } = useSocket();
  const [msg, setMsg] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    startTyping();
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(stopTyping, 2000);
    setTypingTimeout(timeout);
  };

  const handleSend = () => {
    if (!msg.trim()) return;
    sendMessage(msg);
    setMsg('');
    stopTyping();
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  return (
    <div className="p-4 border-t border-border flex items-center space-x-2">
      <Input
        value={msg}
        onChange={e => setMsg(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSend();
          else handleTyping();
        }}
        placeholder="Type a message..."
      />
      <Button onClick={handleSend}>Send</Button>
    </div>
  );
};