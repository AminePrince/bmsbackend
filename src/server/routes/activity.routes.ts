import express from "express";
import { db } from "../db.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.*,
        u.id as userId,
        u.name as userName,
        u.email as userEmail
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Activity logs error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as activityRoutes };