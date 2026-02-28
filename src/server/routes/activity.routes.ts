import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, (req, res) => {
  const logs = db.activityLogs.map(log => ({
    ...log,
    user: db.users.find(u => u.id === log.userId)
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(logs);
});

export { router as activityRoutes };
