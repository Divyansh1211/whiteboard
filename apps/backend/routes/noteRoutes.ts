import { Router } from "express";

export const noteRouter = Router();

noteRouter.get("/", async (req, res) => {
  res.send("notes");
});

noteRouter.get("/:noteId", async (req, res) => {
  res.send(req.params.noteId);
});



