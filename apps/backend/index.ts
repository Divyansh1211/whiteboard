import express from "express";
import cors from "cors";
import { authRouter } from "./routes/authRoutes";
import { noteRouter } from "./routes/noteRoutes";
import { whiteboardRouter } from "./routes/whiteboardRoutes";
import { authMiddleware } from "./middlewares/authMiddleware";
import { Server } from "socket.io";
import http from "http";

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join-room", (noteId) => {
    socket.join(noteId);
    console.log(`user joined room ${noteId}`);
  });

  socket.on("edit-note", (noteId, data) => {
    io.to(noteId).emit("update-note", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
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
