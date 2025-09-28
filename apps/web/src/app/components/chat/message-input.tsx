import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSocket } from '../../../context/SocketProvider';

interface MessageInputProps {
  roomId: string;  // code
  value: string;
  onChange: (e: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export const MessageInput = ({ roomId, value, onChange, onSend, disabled }: MessageInputProps) => {
  const { sendTyping } = useSocket();
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    sendTyping(true, roomId);
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => sendTyping(false, roomId), 2000);
    setTypingTimeout(timeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSend();
    else handleTyping();
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  return (
    <div className="p-4 border-t border-border flex items-center space-x-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
      />
      <Button onClick={onSend} disabled={disabled}>Send</Button>
    </div>
  );
};