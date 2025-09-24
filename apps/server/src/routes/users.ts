import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/auth";
import { User } from "../models";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/me", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}));

router.put("/preferences", authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.preferences = req.body.preferences || user.preferences;
  user.updatedAt = new Date();
  await user.save();
  res.json({ preferences: user.preferences });
}));

export { router as usersRouter };