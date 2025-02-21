import express from "express";
import cors from "cors";
import { authRouter } from "./routes/authRoutes";
import { noteRouter } from "./routes/noteRoutes";
import { whiteboardRouter } from "./routes/whiteboardRoutes";
import { authMiddleware } from "./middlewares/authMiddleware";
import { Server } from "socket.io";
import http from "http";
import { get } from "./network";
import {
  handleClearNote,
  handleClearWhiteBoard,
  handleEditNote,
  handleLeaveRoom,
  handleUpdateWhiteBoard,
} from "./handleSocket";

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room ${roomId}`);
  });

  socket.on("get-note", async (roomId) => {
    const note = await get(roomId);
    socket.emit("update-note", note);
  });

  socket.on("edit-note", handleEditNote);

  socket.on("clear-note", handleClearNote);

  socket.on("get-whiteboard", async (roomId) => {
    const whiteboard = await get(roomId);
    socket.emit("update-whiteboard", roomId, "userId", whiteboard);
  });

  socket.on("update-whiteboard", handleUpdateWhiteBoard);

  socket.on("clear-whiteboard", handleClearWhiteBoard);

  socket.on("leave-room", handleLeaveRoom);

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        console.log(`socket id: ${socket.id}`);
        console.log(`User leaving room ${room}`);
      }
    });
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected", socket.id);
  });
});

app.use(express.json());
app.use(cors());

app.use("/auth", authRouter);
app.use("/notes", authMiddleware, noteRouter);
app.use("/whiteboard", authMiddleware, whiteboardRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.listen(5000, () => {
  console.log("socket.io server is running on port 5000");
});
