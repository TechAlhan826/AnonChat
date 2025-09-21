import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema, insertMessageSchema } from "@shared/schema";
import "./types"; // Import types for Express Request extension

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const createRoomSchema = insertRoomSchema.extend({
  name: z.string().optional(),
  type: z.enum(['group', 'p2p']),
});

const joinRoomSchema = z.object({
  code: z.string().length(6),
  displayName: z.string().optional(),
});

// JWT middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper function to generate room code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const activeConnections = new Map<string, WebSocket>();
  const roomConnections = new Map<string, Set<string>>();

  wss.on('connection', (ws: WebSocket, req) => {
    const connectionId = Math.random().toString(36).substring(7);
    activeConnections.set(connectionId, ws);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-room':
            const roomConnections_set = roomConnections.get(message.roomId) || new Set();
            roomConnections_set.add(connectionId);
            roomConnections.set(message.roomId, roomConnections_set);
            
            // Broadcast join notification
            broadcastToRoom(message.roomId, {
              type: 'user-joined',
              user: message.user,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'leave-room':
            const roomConns = roomConnections.get(message.roomId);
            if (roomConns) {
              roomConns.delete(connectionId);
              if (roomConns.size === 0) {
                roomConnections.delete(message.roomId);
              }
            }
            
            // Broadcast leave notification
            broadcastToRoom(message.roomId, {
              type: 'user-left',
              user: message.user,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'send-message':
            // Save message to storage
            const savedMessage = await storage.createMessage({
              roomId: message.roomId,
              userId: message.userId,
              guestId: message.guestId,
              content: message.content,
              messageType: 'text',
            });

            // Broadcast message to room
            broadcastToRoom(message.roomId, {
              type: 'new-message',
              message: savedMessage,
              sender: message.sender,
            });
            break;

          case 'typing':
            broadcastToRoom(message.roomId, {
              type: 'user-typing',
              user: message.user,
              isTyping: message.isTyping,
            }, connectionId);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      activeConnections.delete(connectionId);
      // Remove from all rooms
      for (const [roomId, connections] of Array.from(roomConnections.entries())) {
        connections.delete(connectionId);
        if (connections.size === 0) {
          roomConnections.delete(roomId);
        }
      }
    });
  });

  function broadcastToRoom(roomId: string, message: any, excludeConnectionId?: string) {
    const connections = roomConnections.get(roomId);
    if (connections) {
      connections.forEach(connectionId => {
        if (connectionId !== excludeConnectionId) {
          const ws = activeConnections.get(connectionId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        }
      });
    }
  }

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      // Create user
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        passwordHash,
      });

      res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }

      // TODO: Implement email sending with nodemailer
      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Guest session routes
  app.post('/api/auth/guest', async (req, res) => {
    try {
      const { displayName } = req.body;
      const sessionToken = jwt.sign(
        { type: 'guest', displayName },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const session = await storage.createGuestSession({
        sessionToken,
        displayName: displayName || `Guest_${Math.random().toString(36).substring(7)}`,
        expiresAt,
      });

      res.json({ sessionToken, session });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Room routes
  app.post('/api/rooms/create', authenticateToken, async (req, res) => {
    try {
      const data = createRoomSchema.parse(req.body);
      
      let code = generateRoomCode();
      // Ensure unique code
      while (await storage.getRoomByCode(code)) {
        code = generateRoomCode();
      }

      const room = await storage.createRoom({
        ...data,
        code,
        createdBy: req.user?.userId || null,
      });

      // Add creator as member
      await storage.addRoomMember(room.id, req.user?.userId);

      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error });
    }
  });

  app.post('/api/rooms/create-guest', async (req, res) => {
    try {
      const data = createRoomSchema.parse(req.body);
      
      let code = generateRoomCode();
      while (await storage.getRoomByCode(code)) {
        code = generateRoomCode();
      }

      const room = await storage.createRoom({
        ...data,
        code,
        createdBy: null,
      });

      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error });
    }
  });

  app.post('/api/rooms/join', async (req, res) => {
    try {
      const data = joinRoomSchema.parse(req.body);
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      const room = await storage.getRoomByCode(data.code);
      if (!room || !room.isActive) {
        return res.status(404).json({ message: 'Room not found' });
      }

      if (token) {
        // Authenticated user
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded.type === 'guest') {
            // Guest user
            await storage.addRoomMember(room.id, undefined, decoded.displayName, decoded.displayName);
          } else {
            // Regular user
            await storage.addRoomMember(room.id, decoded.userId);
          }
        } catch (err) {
          return res.status(403).json({ message: 'Invalid token' });
        }
      } else {
        // No token - create guest session
        const displayName = data.displayName || `Guest_${Math.random().toString(36).substring(7)}`;
        await storage.addRoomMember(room.id, undefined, displayName, displayName);
      }

      const memberCount = await storage.getRoomMemberCount(room.id);
      
      res.json({ room, memberCount });
    } catch (error) {
      res.status(400).json({ message: 'Invalid input', error });
    }
  });

  app.get('/api/rooms/my-rooms', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const rooms = await storage.getUserRooms(req.user.userId);
      
      // Get member counts for each room
      const roomsWithCounts = await Promise.all(
        rooms.map(async (room) => {
          const memberCount = await storage.getRoomMemberCount(room.id);
          const messages = await storage.getRoomMessages(room.id, 1);
          const lastMessage = messages[0] || null;
          
          return {
            ...room,
            memberCount,
            lastMessage,
          };
        })
      );

      res.json(roomsWithCounts);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/rooms/:roomId', async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      const memberCount = await storage.getRoomMemberCount(room.id);
      const members = await storage.getRoomMembers(room.id);
      
      res.json({ room, memberCount, members });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/rooms/:roomId/messages', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getRoomMessages(req.params.roomId, limit);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/rooms/:roomId/leave', async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.type === 'guest') {
          await storage.removeRoomMember(req.params.roomId, undefined, decoded.displayName);
        } else {
          await storage.removeRoomMember(req.params.roomId, decoded.userId);
        }
      }

      res.json({ message: 'Left room successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // User preferences
  app.get('/api/users/me', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/api/users/preferences', authenticateToken, async (req, res) => {
    try {
      const { preferences } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const updatedUser = await storage.updateUser(req.user.userId, { preferences });
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ preferences: updatedUser.preferences });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}
