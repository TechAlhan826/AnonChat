import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Room, RoomMember, Message, GuestSession, User } from "../models";

dotenv.config();

const REDIS_URL = process.env.REDIS_SERVICE_URI || "";
const pub = new Redis(REDIS_URL);
const sub = new Redis(REDIS_URL);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

sub.psubscribe("messages:*");

sub.on("pmessage", (pattern, channel, message) => {
  const roomCode = channel.split(":")[1];
  io.to(roomCode).emit("message", JSON.parse(message));
});

let io: Server;

class SocketService {
  constructor() {
    console.log("Socket Server Initialized...");
    io = new Server({
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
  }

  get io() {
    return io;
  }

  initListeners() {
    console.log("Socket Listeners Initialized...");
    io.on("connect", (socket: Socket) => {
      console.log(`New Socket Connected: ${socket.id}`);

      socket.on("join", async (data: { roomCode: string; token?: string; displayName?: string }) => {
        let userId: string | undefined;
        let guestId: string | undefined;
        let displayName = data.displayName;
        let isGuest = false;

        const room = await Room.findOne({ code: data.roomCode, isActive: true });
        if (!room) return socket.emit("error", { message: "Room not found or inactive" });

        const memberCount = await RoomMember.countDocuments({ roomId: room._id, leftAt: null });
        if (room.type === "p2p" && memberCount >= 2) return socket.emit("error", { message: "P2P room full" });

        if (data.token) {
          try {
            const decoded: any = jwt.verify(data.token, JWT_SECRET);
            if (decoded.type === "guest") {
              isGuest = true;
              const session = await GuestSession.findOne({ sessionToken: data.token });
              if (!session) return socket.emit("error", { message: "Invalid guest session" });
              if (session.currentRoomId && session.currentRoomId.toString() !== room._id.toString()) {
                return socket.emit("error", { message: "Leave previous room first" });
              }
              displayName = session.displayName;
              guestId = session._id.toString();
              session.currentRoomId = room._id;
              await session.save();
            } else {
              const user = await User.findById(decoded.userId);
              if (!user) return socket.emit("error", { message: "User not found" });
              displayName = user.name;
              userId = user._id.toString();
            }
          } catch (err) {
            return socket.emit("error", { message: "Invalid token" });
          }
        } else {
          displayName = displayName || `Guest_${Math.random().toString(36).substring(2, 7)}`;
          const sessionToken = jwt.sign({ type: "guest", displayName }, JWT_SECRET, { expiresIn: "24h" });
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const session = new GuestSession({ sessionToken, displayName, expiresAt, currentRoomId: room._id });
          await session.save();
          guestId = session._id.toString();
          isGuest = true;
          socket.emit("guest-session", { sessionToken });
        }

        const query = { roomId: room._id, leftAt: null, ...(isGuest ? { guestId } : { userId }) };
        let member = await RoomMember.findOne(query);
        if (!member) {
          member = new RoomMember({ roomId: room._id, userId, guestId, displayName });
          await member.save();
        }

        socket.join(data.roomCode);
        socket.data = { ...socket.data, user: { id: isGuest ? guestId : userId, displayName, isGuest }, roomCode: data.roomCode };

        io.to(data.roomCode).emit("user-joined", { user: socket.data.user, timestamp: new Date().toISOString() });
        console.log(`${displayName} joined room ${data.roomCode}`);
      });

      socket.on("event:message", async (data: { message: string }) => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;
        const room = await Room.findOne({ code: roomCode });
        if (!room) return;

        const sender = socket.data.user;
        const msgData = { message: data.message, sender, timestamp: new Date().toISOString() };

        if (room.preserveHistory) {
          const message = new Message({
            roomId: room._id,
            userId: sender.isGuest ? undefined : sender.id,
            guestId: sender.isGuest ? sender.id : undefined,
            content: data.message,
          });
          await message.save();
        }

        await pub.publish(`messages:${roomCode}`, JSON.stringify(msgData));
        console.log(`Message in ${roomCode} from ${sender.displayName}: ${data.message}`);
      });

      socket.on("leave", async () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;
        const sender = socket.data.user;

        const room = await Room.findOne({ code: roomCode });
        if (room) {
          const query = { roomId: room._id, leftAt: null, ...(sender.isGuest ? { guestId: sender.id } : { userId: sender.id }) };
          const member = await RoomMember.findOne(query);
          if (member) {
            member.leftAt = new Date();
            await member.save();
          }

          if (sender.isGuest) {
            const session = await GuestSession.findById(sender.id);
            if (session) {
              session.currentRoomId = null;
              await session.save();
            }
          }
        }

        io.to(roomCode).emit("user-left", { user: sender, timestamp: new Date().toISOString() });
        socket.leave(roomCode);
        socket.data.roomCode = undefined;
      });

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }
}

export default SocketService;