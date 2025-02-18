import { Router } from "express";
import { UserSchema } from "common/types";
import { prismaClient } from "db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middlewares/authMiddleware";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsedBody = UserSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json(parsedBody.error);
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(parsedBody.data.password, 10);
    const userExists = await prismaClient.user.findFirst({
      where: {
        email: parsedBody.data.email,
      },
    });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    const user = await prismaClient.user.create({
      data: {
        email: parsedBody.data.email,
        name: parsedBody.data.name,
        password: hashedPassword,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

authRouter.post("/login", async (req, res) => {
  const parsedBody = UserSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json(parsedBody.error);
    return;
  }
  try {
    const user = await prismaClient.user.findFirst({
      where: {
        email: parsedBody.data.email,
      },
    });
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }
    const passwordMatch = await bcrypt.compare(
      parsedBody.data.password,
      user.password
    );
    if (!passwordMatch) {
      res.status(400).json({ message: "Invalid password" });
      return;
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
    res.json({ token });
  } catch (err) {
    res.status(500).json(err);
  }
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  const id = req.body.userId;
  const user = await prismaClient.user.findUnique({
    where: {
      id,
    },
  });
  res.json(user);
});

