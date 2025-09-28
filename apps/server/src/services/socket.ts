import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Room, Message } from "../models";

dotenv.config();

const REDIS_URL = process.env.REDIS_SERVICE_URI || "";
const pub = new Redis(REDIS_URL);
const sub = new Redis(REDIS_URL);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

class SocketService {
  private _io: Server;

  constructor() {
    console.log("Socket Server Initialized...");
    this._io = new Server({
      cors: { origin: "*", methods: ["GET", "POST"] },
    });

    sub.psubscribe("messages:*");
    sub.on("pmessage", (pattern, channel, message) => {
      const roomCode = channel.split(":")[1];
      this._io.to(roomCode).emit("message", JSON.parse(message));
    });
  }

  get io() {
    return this._io;
  }

  initListeners() {
    console.log("Socket Listeners Initialized...");
    const io = this.io;

    io.on("connect", (socket: Socket) => {
      console.log(`New Socket Connected: ${socket.id}`);
      const token = socket.handshake.auth.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          socket.data.user = decoded;
          socket.data.displayName = decoded.name || decoded.displayName || 'User';
        } catch {
          socket.disconnect();
          return;
        }
      } else {
        socket.data.displayName = 'Guest';
      }

      socket.on('join', async (data: { roomCode: string }) => {
        const roomCode = data.roomCode;
        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit('error', 'Room not found');

        const connected = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
        if (room.type === 'p2p' && connected >= 2) return socket.emit('error', 'P2P full');

        socket.join(roomCode);
        socket.data.roomCode = roomCode;

        // Exclude self for join notification
        socket.to(roomCode).emit('user-joined', { user: socket.data.displayName, roomCode, timestamp: new Date().toISOString() });
        console.log(`${socket.data.displayName} joined ${roomCode}`);
      });

      socket.on('event:message', async (data: { message: string }) => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        const msgData = { message: data.message, sender: socket.data.displayName, roomCode, timestamp: new Date().toISOString() };

        if (room.preserveHistory) {
          const message = new Message({
            roomId: room._id,
            userId: socket.data.user?.userId,
            guestId: socket.data.user?.type === 'guest' ? socket.data.user.id : undefined,
            content: data.message,
            sender: socket.data.displayName,
          });
          await message.save();
        }

        await pub.publish(`messages:${roomCode}`, JSON.stringify(msgData));
        console.log(`Message in ${roomCode}: ${data.message}`);
      });

      socket.on('typing', (data: { isTyping: boolean }) => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;
        // Exclude self
        socket.to(roomCode).emit('user-typing', { user: socket.data.displayName, isTyping: data.isTyping, roomCode });
      });

      socket.on('leave', () => {
        const roomCode = socket.data.roomCode;
        if (roomCode) {
          // Exclude self for leave
          socket.to(roomCode).emit('user-left', { user: socket.data.displayName, roomCode, timestamp: new Date().toISOString() });
          socket.leave(roomCode);
          socket.data.roomCode = undefined;
        }
      });

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const roomCode = socket.data.roomCode;
        if (roomCode) {
          socket.to(roomCode).emit('user-left', { user: socket.data.displayName, roomCode, timestamp: new Date().toISOString() });
        }
      });
    });
  }
}

export default SocketService;