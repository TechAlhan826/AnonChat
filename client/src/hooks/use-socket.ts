import { useEffect, useRef, useCallback } from "react";
import { socketClient } from "@/lib/socket";

export function useSocket() {
  const isConnected = useRef(false);

  useEffect(() => {
    if (!isConnected.current) {
      socketClient.connect();
      isConnected.current = true;
    }

    return () => {
      if (isConnected.current) {
        socketClient.disconnect();
        isConnected.current = false;
      }
    };
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketClient.on(event, callback);
    
    return () => {
      socketClient.off(event, callback);
    };
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
    on,
    emit,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
  };
}
