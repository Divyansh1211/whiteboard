import express from "express";
import cors from "cors";
import { authRouter } from "./routes/authRoutes";
import { noteRouter } from "./routes/noteRoutes";
import { whiteboardRouter } from "./routes/whiteboardRoutes";
import { authMiddleware } from "./middlewares/authMiddleware";


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use("/auth", authRouter);
app.use("/notes",authMiddleware, noteRouter);
app.use("/whiteboard",authMiddleware ,whiteboardRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
