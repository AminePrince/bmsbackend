import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const [rows] = await db.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [user.id]
    );

    res.json(rows);

  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;

    const [[notification]] = await db.query(
      `SELECT * FROM notifications WHERE id=? AND user_id=?`,
      [id, user.id]
    );

    if (!notification)
      return res.status(404).json({ message: "Notification non trouvée" });

    await db.query(
      `UPDATE notifications SET \`read\`=true WHERE id=?`,
      [id]
    );

    const [[updated]] = await db.query(
      `SELECT * FROM notifications WHERE id=?`,
      [id]
    );

    res.json(updated);

  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/read-all", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    await db.query(
      `UPDATE notifications SET \`read\`=true WHERE user_id=?`,
      [user.id]
    );

    res.status(204).send();

  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export const createNotification = async (
  userId: number,
  title: string,
  message: string,
  type: "maintenance" | "rental" | "payment" | "document"
) => {
  try {
    await db.query(
      `
      INSERT INTO notifications
      (user_id, title, message, \`read\`, type, created_at)
      VALUES (?, ?, ?, false, ?, NOW())
      `,
      [userId, title, message, type]
    );
  } catch (error) {
    console.error("Create notification error:", error);
  }
};

export { router as notificationRoutes };