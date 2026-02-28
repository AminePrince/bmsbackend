import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { FinanceService } from "../services/finance.service.js";
import { NotificationService } from "../services/notification.service.js";

const router = express.Router();

router.get("/stats", authMiddleware, (req, res) => {
  res.json(FinanceService.getStats());
});

router.get("/logs", authMiddleware, adminMiddleware, (req, res) => {
  res.json(db.financialLogs);
});

router.post("/notify-deadlines", authMiddleware, adminMiddleware, (req, res) => {
  NotificationService.checkDeadlines();
  res.json({ message: "Vérification des échéances terminée et notifications envoyées." });
});

export { router as financeRoutes };
