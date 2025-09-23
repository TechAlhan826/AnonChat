import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { User } from "../models";

const router = Router();

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/preferences", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.preferences = req.body.preferences || user.preferences;
    user.updatedAt = new Date();
    await user.save();
    res.json({ preferences: user.preferences });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

export { router as usersRouter };