import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const notifications = db.notifications
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(notifications);
});

router.patch("/:id/read", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const user = (req as any).user;
  const notification = db.notifications.find(n => n.id === id && n.userId === user.id);

  if (!notification) return res.status(404).json({ message: "Notification non trouvée" });

  notification.read = true;
  res.json(notification);
});

router.post("/read-all", authMiddleware, (req, res) => {
  const user = (req as any).user;
  db.notifications
    .filter(n => n.userId === user.id)
    .forEach(n => n.read = true);
  res.status(204).send();
});

export const createNotification = (userId: number, title: string, message: string, type: 'maintenance' | 'rental' | 'payment' | 'document') => {
  const newNotification = {
    id: db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1,
    userId,
    title,
    message,
    read: false,
    type,
    createdAt: new Date().toISOString()
  };
  db.notifications.push(newNotification);
};

export { router as notificationRoutes };
