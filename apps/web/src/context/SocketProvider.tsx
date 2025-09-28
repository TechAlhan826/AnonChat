'use client'
import React, { useEffect, useState, useCallback, useContext } from "react";
import { io, Socket } from "socket.io-client";
import Cookies from 'js-cookie';

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
  const reconnectAttempts = React.useRef(0);
  const maxReconnectAttempts = 5;

  const addMessage = useCallback((msg: Message, roomCode: string) => {
    setMessages((prev) => ({
      ...prev,
      [roomCode]: [...(prev[roomCode] || []), msg],
    }));
  }, []);

  const onMessageReceived = useCallback((data: any) => {
    const { message, roomCode, sender, timestamp } = data;
    if (!roomCode) return;
    addMessage({ content: message, sender, timestamp }, roomCode);
    console.log(`New Message in ${roomCode}: ${message}`);
  }, [addMessage]);

  const onUserJoined = useCallback((data: any) => {
    const { user, roomCode, timestamp } = data;
    if (user === (Cookies.get('token') ? 'User' : 'Guest')) return;  // Exclude self
    addMessage({ content: `${user} joined`, sender: 'system', timestamp }, roomCode);
  }, [addMessage]);

  const onUserLeft = useCallback((data: any) => {
    const { user, roomCode, timestamp } = data;
    if (user === (Cookies.get('token') ? 'User' : 'Guest')) return;  // Exclude self
    addMessage({ content: `${user} left`, sender: 'system', timestamp }, roomCode);
  }, [addMessage]);

  const onUserTyping = useCallback((data: any) => {
    const { user, isTyping, roomCode } = data;
    if (user === (Cookies.get('token') ? 'User' : 'Guest')) return;  // Exclude self
    setTypingUsers((prev) => {
      const users = new Set(prev[roomCode] || []);
      if (isTyping) users.add(user);
      else users.delete(user);
      return { ...prev, [roomCode]: Array.from(users) };
    });
  }, []);

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token_fallback');
    const _socket = io("http://localhost:5000", {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    _socket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('Socket connected');
    });

    _socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    _socket.on('connect_error', (err) => {
      console.error('Connect error:', err);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(() => _socket.connect(), Math.pow(2, reconnectAttempts.current) * 1000);
      }
    });

    _socket.on('message', onMessageReceived);
    _socket.on('user-joined', onUserJoined);
    _socket.on('user-left', onUserLeft);
    _socket.on('user-typing', onUserTyping);

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
      console.log(`Send Message in ${roomCode}: ${msg}`);
      socket.emit('event:message', { message: msg, roomCode });
    }
  }, [socket]);

  const joinRoom = useCallback((roomCode: string) => {
    if (socket && roomCode) {
      socket.emit('join', { roomCode });
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