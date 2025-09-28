import { useEffect, useRef, useCallback, useState } from "react";
import { socketClient } from "../lib/socket";

export function useSocket() {
  const isMounted = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isMounted.current) {
      socketClient.connect();
      setIsConnected(true);  // Update on connect.
    }

    return () => {
      isMounted.current = false;
      socketClient.disconnect();
      setIsConnected(false);
    };
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    return socketClient.on(event, callback);  // Returns cleanup fn.
  }, []);

  const emit = useCallback((event: any) => {
    socketClient.send(event);
  }, []);

  const joinRoom = useCallback((roomId: string, user: any) => {
    socketClient.joinRoom(roomId, user);
  }, []);

  const leaveRoom = useCallback((roomId: string, user: any) => {
    socketClient.leaveRoom(roomId, user);
  }, []);

  const sendMessage = useCallback((roomId: string, content: string, userId?: string, guestId?: string, sender?: any) => {
    socketClient.sendMessage(roomId, content, userId, guestId, sender);
  }, []);

  const sendTyping = useCallback((roomId: string, user: any, isTyping: boolean) => {
    socketClient.sendTyping(roomId, user, isTyping);
  }, []);

  return {
    isConnected,
    on,
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
  };
}