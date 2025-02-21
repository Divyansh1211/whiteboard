import { prismaClient } from "db";
import { Router } from "express";

export const whiteboardRouter = Router();

whiteboardRouter.get("/", async (req, res) => {
  const userId = req.body.userId;
  try {
    const whiteboards = await prismaClient.whiteboard.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: {
        lastModified: "desc",
      },
    });
    res.json(whiteboards);
  } catch (e) {
    res.status(500).json({ message: "Internal server error" });
  }
});

whiteboardRouter.post("/delete", async (req, res) => {
  const { id } = req.body;
  try {
    await prismaClient.whiteboard.deleteMany({
      where: {
        canvasId: id,
      },
    });
    res.json({ message: "Whiteboard deleted" });
  } catch (e) {
    res.status(500).json({ message: "Internal server error" });
  }
});
