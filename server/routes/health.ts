import { Router } from "express";
import { connectDB } from "../lib/db";

const router = Router();

router.get("/api/health", async (_req, res) => {
  try {
    await connectDB();
    res.json({ status: "ok", mongo: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(503).json({ status: "error", mongo: "disconnected", error: message });
  }
});

export default router;
