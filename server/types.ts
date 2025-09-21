import { Request } from "express";

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        type?: string;
        displayName?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    type?: string;
    displayName?: string;
  };
}