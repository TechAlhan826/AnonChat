import 'express';

declare module 'express' {
  interface Request {
    user?: { id: string; email: string };
    guest?: { id: string; displayName: string };
  }
}