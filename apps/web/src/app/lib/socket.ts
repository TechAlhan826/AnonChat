import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

export interface SocketMessage {
  type: 'join-room' | 'leave-room' | 'send-message' | 'typing' | 'user-joined' | 'user-left' | 'new-message' | 'user-typing';
  roomId?: string;
  userId?: string;
  guestId?: string;
  content?: string;
  user?: any;
  sender?: any;
  message?: any;
  isTyping?: boolean;
  timestamp?: string;
}

export class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) return;

    const token = Cookies.get('token');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
  this.socket = io(backendUrl, {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token },  // Secure: Send token for backend verify.
    });

    this.socket.on('connect', () => {
      console.log('Socket.io connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket.io disconnected: ${reason}`);
      if (reason === 'io server disconnect') {
        // Manual reconnect if server forced.
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io connect error:', error);
      this.attemptReconnect();
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Manual reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.socket?.connect();
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  send(message: SocketMessage) {
    if (this.socket?.connected) {
      this.socket.emit(message.type, message);
    } else {
      console.warn('Socket not connected, message not sent:', message);
    }
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
    return () => this.socket?.off(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  // Convenience methods (emit wrappers)
  joinRoom(roomId: string, user: any) {
    this.send({ type: 'join-room', roomId, user });
  }

  leaveRoom(roomId: string, user: any) {
    this.send({ type: 'leave-room', roomId, user });
  }

  sendMessage(roomId: string, content: string, userId?: string, guestId?: string, sender?: any) {
    this.send({ type: 'send-message', roomId, content, userId, guestId, sender });
  }

  sendTyping(roomId: string, user: any, isTyping: boolean) {
    this.send({ type: 'typing', roomId, user, isTyping });
  }
}

export const socketClient = new SocketClient();