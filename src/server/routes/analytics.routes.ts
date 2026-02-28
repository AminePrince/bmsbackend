import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { AnalyticsService } from "../services/analytics.service.js";

const router = express.Router();

router.get("/overview", authMiddleware, adminMiddleware, (req, res) => {
  const stats = AnalyticsService.getStats();
  res.json(stats);
});

export { router as analyticsRoutes };
