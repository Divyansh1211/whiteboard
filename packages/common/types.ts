import { z } from "zod";

export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
});

export const NotesSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(2),
});
