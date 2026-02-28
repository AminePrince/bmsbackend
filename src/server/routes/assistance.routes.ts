import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createActivityLog } from "../middleware/activity.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const assistances = db.assistances.map(a => ({
    ...a,
    client: db.clients.find(c => c.id === a.clientId),
    rental: db.rentals.find(r => r.id === a.rentalId),
    assignee: db.users.find(u => u.id === a.assignedTo)
  }));
  res.json(assistances);
});

router.post("/", authMiddleware, (req, res) => {
  const { clientId, rentalId, issueType, description } = req.body;
  const user = (req as any).user;

  const newAssistance = {
    id: db.assistances.length > 0 ? Math.max(...db.assistances.map(a => a.id)) + 1 : 1,
    clientId,
    rentalId,
    issueType,
    description,
    status: 'nouveau' as const,
    createdAt: new Date().toISOString()
  };

  db.assistances.push(newAssistance);
  createActivityLog(user.id, "CREATE", "ASSISTANCE", `Nouvelle demande d'assistance #${newAssistance.id}`, req.ip);
  res.status(201).json(newAssistance);
});

router.patch("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { status, assignedTo } = req.body;
  const user = (req as any).user;
  const assistance = db.assistances.find(a => a.id === id);

  if (!assistance) return res.status(404).json({ message: "Assistance non trouvée" });

  if (status) assistance.status = status;
  if (assignedTo) assistance.assignedTo = assignedTo;

  createActivityLog(user.id, "UPDATE", "ASSISTANCE", `Mise à jour de l'assistance #${id}`, req.ip);
  res.json(assistance);
});

export { router as assistanceRoutes };
