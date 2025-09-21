import { type User, type InsertUser, type Room, type InsertRoom, type Message, type InsertMessage, type RoomMember, type GuestSession, type InsertGuestSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Room operations
  getRoom(id: string): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined>;
  getUserRooms(userId: string): Promise<Room[]>;

  // Room member operations
  addRoomMember(roomId: string, userId?: string, guestId?: string, displayName?: string): Promise<RoomMember>;
  removeRoomMember(roomId: string, userId?: string, guestId?: string): Promise<void>;
  getRoomMembers(roomId: string): Promise<RoomMember[]>;
  getRoomMemberCount(roomId: string): Promise<number>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getRoomMessages(roomId: string, limit?: number): Promise<Message[]>;

  // Guest session operations
  createGuestSession(session: InsertGuestSession): Promise<GuestSession>;
  getGuestSession(sessionToken: string): Promise<GuestSession | undefined>;
  updateGuestSession(sessionToken: string, updates: Partial<GuestSession>): Promise<GuestSession | undefined>;
  deleteGuestSession(sessionToken: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private rooms: Map<string, Room> = new Map();
  private roomMembers: Map<string, RoomMember[]> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private guestSessions: Map<string, GuestSession> = new Map();
  private roomCodeIndex: Map<string, string> = new Map(); // code -> roomId
  private emailIndex: Map<string, string> = new Map(); // email -> userId

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isVerified: false,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    this.emailIndex.set(user.email, id);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Room operations
  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const roomId = this.roomCodeIndex.get(code);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = randomUUID();
    const room: Room = {
      ...insertRoom,
      id,
      name: insertRoom.name || null,
      createdBy: insertRoom.createdBy || null,
      isActive: insertRoom.isActive ?? true,
      preserveHistory: insertRoom.preserveHistory ?? false,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    this.roomCodeIndex.set(room.code, id);
    this.roomMembers.set(id, []);
    this.messages.set(id, []);
    return room;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    const userRooms: Room[] = [];
    
    for (const [roomId, members] of Array.from(this.roomMembers.entries())) {
      const isMember = members.some(member => member.userId === userId && !member.leftAt);
      if (isMember) {
        const room = this.rooms.get(roomId);
        if (room) userRooms.push(room);
      }
    }
    
    return userRooms;
  }

  // Room member operations
  async addRoomMember(roomId: string, userId?: string, guestId?: string, displayName?: string): Promise<RoomMember> {
    const id = randomUUID();
    const member: RoomMember = {
      id,
      roomId,
      userId: userId || null,
      guestId: guestId || null,
      displayName: displayName || null,
      joinedAt: new Date(),
      leftAt: null,
    };
    
    const members = this.roomMembers.get(roomId) || [];
    members.push(member);
    this.roomMembers.set(roomId, members);
    
    return member;
  }

  async removeRoomMember(roomId: string, userId?: string, guestId?: string): Promise<void> {
    const members = this.roomMembers.get(roomId) || [];
    const updatedMembers = members.map(member => {
      if ((userId && member.userId === userId) || (guestId && member.guestId === guestId)) {
        return { ...member, leftAt: new Date() };
      }
      return member;
    });
    this.roomMembers.set(roomId, updatedMembers);
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    return this.roomMembers.get(roomId) || [];
  }

  async getRoomMemberCount(roomId: string): Promise<number> {
    const members = this.roomMembers.get(roomId) || [];
    return members.filter(member => !member.leftAt).length;
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      userId: insertMessage.userId || null,
      guestId: insertMessage.guestId || null,
      messageType: insertMessage.messageType || 'text',
      createdAt: new Date(),
    };
    
    const messages = this.messages.get(insertMessage.roomId) || [];
    messages.push(message);
    this.messages.set(insertMessage.roomId, messages);
    
    return message;
  }

  async getRoomMessages(roomId: string, limit = 50): Promise<Message[]> {
    const messages = this.messages.get(roomId) || [];
    return messages.slice(-limit);
  }

  // Guest session operations
  async createGuestSession(insertSession: InsertGuestSession): Promise<GuestSession> {
    const id = randomUUID();
    const session: GuestSession = {
      ...insertSession,
      id,
      currentRoomId: insertSession.currentRoomId || null,
      createdAt: new Date(),
    };
    
    this.guestSessions.set(session.sessionToken, session);
    return session;
  }

  async getGuestSession(sessionToken: string): Promise<GuestSession | undefined> {
    return this.guestSessions.get(sessionToken);
  }

  async updateGuestSession(sessionToken: string, updates: Partial<GuestSession>): Promise<GuestSession | undefined> {
    const session = this.guestSessions.get(sessionToken);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.guestSessions.set(sessionToken, updatedSession);
    return updatedSession;
  }

  async deleteGuestSession(sessionToken: string): Promise<void> {
    this.guestSessions.delete(sessionToken);
  }
}

export const storage = new MemStorage();
