import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  res.json(db.payments);
});

router.post("/", authMiddleware, (req, res) => {
  const { rentalId, amount, method, notes } = req.body;
  
  const rental = db.rentals.find(r => r.id === rentalId);
  if (!rental) return res.status(404).json({ message: "Location non trouvée" });

  const newPayment = {
    id: db.payments.length > 0 ? Math.max(...db.payments.map(p => p.id)) + 1 : 1,
    rentalId,
    amount,
    method,
    notes: notes || "",
    paymentDate: new Date().toISOString()
  };

  db.payments.push(newPayment);
  res.status(201).json(newPayment);
});

export { router as paymentRoutes };
