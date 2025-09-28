'use client'
import React, { useEffect, useState, useCallback, useContext, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

interface Message {
  content: string;
  sender: string;
  timestamp: string;
}

interface SocketContextI {
  sendMessage: (msg: string, roomCode: string) => void;
  addMessage: (msg: Message, roomCode: string) => void;
  messages: { [roomCode: string]: Message[] };
  joinRoom: (roomCode: string) => void;
  leaveRoom: (roomCode: string) => void;
  sendTyping: (isTyping: boolean, roomCode: string) => void;
  typingUsers: { [roomCode: string]: string[] };
  isConnected: boolean;
}

const defaultContext: SocketContextI = {
  sendMessage: () => {},
  addMessage: () => {},
  messages: {},
  joinRoom: () => {},
  leaveRoom: () => {},
  sendTyping: () => {},
  typingUsers: {},
  isConnected: false,
};

const SocketContext = React.createContext<SocketContextI>(defaultContext);

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children?: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const [messages, setMessages] = useState<{ [roomCode: string]: Message[] }>({});
  const [typingUsers, setTypingUsers] = useState<{ [roomCode: string]: string[] }>({});
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const currentUserName = useRef<string>('');

  // Get current user name from token
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        currentUserName.current = decoded.name || 'User';
      } catch {
        currentUserName.current = 'Guest';
      }
    } else {
      currentUserName.current = 'Guest';
    }
  }, []);

  const addMessage = useCallback((msg: Message, roomCode: string) => {
    setMessages((prev) => ({
      ...prev,
      [roomCode]: [...(prev[roomCode] || []), msg],
    }));
  }, []);

  const onMessageReceived = useCallback((data: any) => {
    const { message, roomCode, sender, timestamp } = data;
    if (!roomCode) return;
    
    // Always add received messages (including our own echoed back)
    addMessage({ content: message, sender, timestamp }, roomCode);
    console.log(`New Message in ${roomCode}: ${message} from ${sender}`);
  }, [addMessage]);

  const onUserJoined = useCallback((data: any) => {
    const { user, roomCode, timestamp } = data;
    // Don't exclude self - let the message show for all joins
    addMessage({ content: `${user} joined`, sender: 'system', timestamp }, roomCode);
  }, [addMessage]);

  const onUserLeft = useCallback((data: any) => {
    const { user, roomCode, timestamp } = data;
    // Don't exclude self - let the message show for all leaves
    addMessage({ content: `${user} left`, sender: 'system', timestamp }, roomCode);
  }, [addMessage]);

  const onUserTyping = useCallback((data: any) => {
    const { user, isTyping, roomCode } = data;
    // Exclude self for typing indicators
    if (user === currentUserName.current) return;
    
    setTypingUsers((prev) => {
      const users = new Set(prev[roomCode] || []);
      if (isTyping) {
        users.add(user);
      } else {
        users.delete(user);
      }
      return { ...prev, [roomCode]: Array.from(users) };
    });
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  const _socket = io(backendUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    _socket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('Socket connected');
    });

    _socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    _socket.on('connect_error', (err) => {
      console.error('Connect error:', err);
      setIsConnected(false);
      
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(() => {
          console.log(`Reconnection attempt ${reconnectAttempts.current}`);
          _socket.connect();
        }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000));
      } else {
        console.error('Max reconnection attempts reached');
      }
    });

    _socket.on('message', onMessageReceived);
    _socket.on('user-joined', onUserJoined);
    _socket.on('user-left', onUserLeft);
    _socket.on('user-typing', onUserTyping);

    _socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(_socket);

    return () => {
      _socket.disconnect();
      _socket.off('message', onMessageReceived);
      _socket.off('user-joined', onUserJoined);
      _socket.off('user-left', onUserLeft);
      _socket.off('user-typing', onUserTyping);
      setSocket(undefined);
    };
  }, [onMessageReceived, onUserJoined, onUserLeft, onUserTyping]);

  const sendMessage = useCallback((msg: string, roomCode: string) => {
    if (socket && msg && roomCode) {
      console.log(`Sending Message in ${roomCode}: ${msg}`);
      socket.emit('event:message', { message: msg, roomCode });
    }
  }, [socket]);

  const joinRoom = useCallback((roomCode: string) => {
    if (socket && roomCode) {
      socket.emit('join', { roomCode });
      // Initialize message arrays if they don't exist
      setMessages((prev) => ({ ...prev, [roomCode]: prev[roomCode] || [] }));
      setTypingUsers((prev) => ({ ...prev, [roomCode]: prev[roomCode] || [] }));
    }
  }, [socket]);

  const leaveRoom = useCallback((roomCode: string) => {
    if (socket && roomCode) {
      socket.emit('leave', { roomCode });
    }
  }, [socket]);

  const sendTyping = useCallback((isTyping: boolean, roomCode: string) => {
    if (socket && roomCode) {
      socket.emit('typing', { isTyping, roomCode });
    }
  }, [socket]);

  const value: SocketContextI = {
    sendMessage,
    addMessage,
    messages,
    joinRoom,
    leaveRoom,
    sendTyping,
    typingUsers,
    isConnected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};