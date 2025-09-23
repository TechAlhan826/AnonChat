import { Router } from "express";
import { z } from "zod";
import { authenticate, authenticateOptional } from "../middlewares/auth";
import { Room, RoomMember, Message, GuestSession, User } from "../models";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const router = Router();

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const createRoomSchema = z.object({
  type: z.enum(["p2p", "group"]),
});

router.post("/create", authenticate, async (req, res) => {
  try {
    const data = createRoomSchema.parse(req.body);
    let code = generateRoomCode();
    while (await Room.findOne({ code })) code = generateRoomCode();
    const room = new Room({ code, type: data.type, createdBy: req.user!.id });
    await room.save();
    const creator = await User.findById(req.user!.id);
    const member = new RoomMember({ roomId: room._id, userId: req.user!.id, displayName: creator?.name });
    await member.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: "Invalid input" });
  }
});

router.post("/create-guest", async (req, res) => {
  try {
    const data = createRoomSchema.parse(req.body);
    let code = generateRoomCode();
    while (await Room.findOne({ code })) code = generateRoomCode();
    const room = new Room({ code, type: data.type });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: "Invalid input" });
  }
});

router.post("/join", authenticateOptional, async (req, res) => {
  const schema = z.object({ code: z.string().length(6), displayName: z.string().optional() });
  try {
    const data = schema.parse(req.body);
    const room = await Room.findOne({ code: data.code, isActive: true });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const memberCount = await RoomMember.countDocuments({ roomId: room._id, leftAt: null });
    if (room.type === "p2p" && memberCount >= 2) return res.status(400).json({ message: "P2P full" });

    let userId, guestId, displayName = data.displayName;
    if (req.user) {
      const user = await User.findById(req.user.id);
      displayName = user?.name;
      userId = req.user.id;
    } else if (req.guest) {
      displayName = req.guest.displayName;
      guestId = req.guest.id;
      const session = await GuestSession.findById(guestId);
      if (session?.currentRoomId && session.currentRoomId.toString() !== room._id.toString()) {
        return res.status(400).json({ message: "Leave previous room first" });
      }
      session!.currentRoomId = room._id;
      await session!.save();
    } else {
      // Create guest
      displayName = displayName || `Guest_${Math.random().toString(36).substring(2, 7)}`;
      const sessionToken = jwt.sign({ type: "guest", displayName }, JWT_SECRET, { expiresIn: "24h" });
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const session = new GuestSession({ sessionToken, displayName, expiresAt, currentRoomId: room._id });
      await session.save();
      guestId = session._id.toString();
      return res.json({ room, sessionToken }); // Frontend store
    }

    const query = { roomId: room._id, leftAt: null, ...(userId ? { userId } : { guestId }) };
    if (await RoomMember.findOne(query)) return res.status(400).json({ message: "Already joined" });

    const member = new RoomMember({ roomId: room._id, userId, guestId, displayName });
    await member.save();

    res.json(room);
  } catch (err) {
    res.status(400).json({ message: "Invalid input" });
  }
});

router.get("/my-rooms", authenticate, async (req, res) => {
  try {
    const members = await RoomMember.find({ userId: req.user!.id, leftAt: null });
    const roomIds = members.map((m) => m.roomId);
    const rooms = await Room.find({ _id: { $in: roomIds } });
    const enhanced = await Promise.all(
      rooms.map(async (r) => {
        const count = await RoomMember.countDocuments({ roomId: r._id, leftAt: null });
        const lastMsg = await Message.findOne({ roomId: r._id }).sort({ createdAt: -1 });
        return { ...r.toObject(), memberCount: count, lastMessage: lastMsg ? lastMsg.content : null };
      })
    );
    res.json(enhanced);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:code/messages", async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const messages = await Message.find({ roomId: room._id }).sort({ createdAt: 1 }).limit(50);
    res.json(messages);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:code/leave", authenticateOptional, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ message: "Room not found" });
    const id = req.user?.id || req.guest?.id;
    const isGuest = !!req.guest;
    if (!id) return res.status(401).json({ message: "Auth required" });

    const query = { roomId: room._id, leftAt: null, ...(isGuest ? { guestId: id } : { userId: id }) };
    const member = await RoomMember.findOne(query);
    if (!member) return res.status(404).json({ message: "Not a member" });

    member.leftAt = new Date();
    await member.save();

    if (isGuest) {
      const session = await GuestSession.findById(id);
      if (session) {
        session.currentRoomId = null;
        await session.save();
      }
    }

    res.json({ message: "Left room" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:code/preserve", authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room || room.createdBy?.toString() !== req.user!.id) return res.status(403).json({ message: "Not authorized" });
    room.preserveHistory = req.body.preserve;
    await room.save();
    res.json(room);
  } catch {
    res.status(400).json({ message: "Invalid input" });
  }
});

export { router as roomsRouter };