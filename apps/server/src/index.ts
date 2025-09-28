import http from "http";
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";  // Added types
import dotenv from "dotenv";
import mongoose from "mongoose";
import SocketService from "./services/socket";
import { roomsRouter } from "./routes/rooms";
import { usersRouter } from "./routes/users";
import cors from "cors";
import "./remove-console-prod";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));  // Allow all origins for simplicity; adjust in production.

const httpServer = http.createServer(app);
const socketService = new SocketService();
socketService.io.attach(httpServer);

app.use("/api/rooms", roomsRouter);
app.use("/api/users", usersRouter);

// Global error handler: Catches unhandled errors/rejections; logs for debug, responds generically (secure: no leak details).
const errorHandler: ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);  // Server-side log only.
  res.status(500).json({ message: 'Server error' });
};
app.use(errorHandler);

async function init() {
  await mongoose.connect(process.env.MONGO_URI || "", { dbName: "AnonChat" });
  socketService.initListeners();
  const PORT = parseInt(process.env.PORT || '5000', 10);  // Parse to number; safe default.
  httpServer.listen(PORT, () => console.log(`HTTP Server Running on PORT: ${PORT}`));
}

init();