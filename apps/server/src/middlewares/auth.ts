import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GuestSession } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    res.status(403).json({ message: 'Invalid token' });
  }
};

export const authenticateOptional = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type === 'guest') {
        const session = await GuestSession.findOne({ sessionToken: token });
        if (!session) throw new Error('Invalid guest session');
        req.guest = { id: session._id.toString(), displayName: session.displayName };
      } else {
        req.user = { id: decoded.userId, email: decoded.email };
      }
    } catch {} // Silent fail for optional
  }
  next();
};