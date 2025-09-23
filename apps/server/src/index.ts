import http from "http";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import SocketService from "./services/socket";
import { roomsRouter } from "./routes/rooms"; // See below
import { usersRouter } from "./routes/users";

dotenv.config();

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const socketService = new SocketService();
socketService.io.attach(httpServer);

app.use("/api/rooms", roomsRouter);
app.use("/api/users", usersRouter);

async function init() {
  await mongoose.connect(process.env.MONGO_URI || "", { dbName: "anonchat" }); // Same DB as auth
  socketService.initListeners();
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`HTTP Server Running on PORT: ${PORT}`));
}

init();