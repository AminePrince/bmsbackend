import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createActivityLog } from "../middleware/activity.middleware.js";
import { createNotification } from "./notification.routes.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const incidents = db.incidents.map(inc => ({
    ...inc,
    rental: db.rentals.find(r => r.id === inc.rentalId)
  }));
  res.json(incidents);
});

router.post("/", authMiddleware, (req, res) => {
  const { 
    rentalId, type, description, amount, status, date,
    insuranceClaimNumber, reimbursementExpectedDate, reimbursementAmount
  } = req.body;
  const user = (req as any).user;

  const newIncident = {
    id: db.incidents.length > 0 ? Math.max(...db.incidents.map(i => i.id)) + 1 : 1,
    rentalId,
    type,
    description,
    amount,
    status,
    date,
    insuranceClaimNumber,
    reimbursementExpectedDate,
    reimbursementAmount,
    remainingBalance: reimbursementAmount || 0,
    insurancePaymentStatus: reimbursementAmount ? 'en_attente' : undefined,
    createdAt: new Date().toISOString()
  };

  db.incidents.push(newIncident);
  createActivityLog(user.id, "CREATE", "INCIDENT", `Nouvel incident #${newIncident.id} pour la location #${rentalId}`, req.ip);
  
  // Notify all admins
  db.users.filter(u => u.role === 'admin').forEach(admin => {
    createNotification(admin.id, "Nouvel Incident", `Un incident de type ${type} a été signalé pour la location #${rentalId}`, 'rental');
  });

  res.status(201).json(newIncident);
});

router.patch("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { 
    status, description, amount, 
    insurancePaymentStatus, reimbursementReceivedDate, reimbursementAmountReceived 
  } = req.body;
  const user = (req as any).user;
  const incident = db.incidents.find(i => i.id === id);

  if (!incident) return res.status(404).json({ message: "Incident non trouvé" });

  if (status) incident.status = status;
  if (description) incident.description = description;
  if (amount) incident.amount = amount;
  
  if (insurancePaymentStatus) incident.insurancePaymentStatus = insurancePaymentStatus;
  if (reimbursementReceivedDate) incident.reimbursementReceivedDate = reimbursementReceivedDate;
  
  if (reimbursementAmountReceived) {
    incident.reimbursementAmount = (incident.reimbursementAmount || 0);
    incident.remainingBalance = (incident.reimbursementAmount || 0) - reimbursementAmountReceived;
    if (incident.remainingBalance <= 0) {
      incident.insurancePaymentStatus = 'payé';
    } else {
      incident.insurancePaymentStatus = 'partiel';
    }
  }

  createActivityLog(user.id, "UPDATE", "INCIDENT", `Mise à jour de l'incident #${id}`, req.ip);
  res.json(incident);
});

export { router as incidentRoutes };
