import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      guest?: {
        id: string;
        displayName: string;
      };
    }
  }
}