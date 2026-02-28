import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { InstallmentService } from "../services/installment.service.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const installments = db.vehicleInstallments.map(i => ({
    ...i,
    car: db.cars.find(c => c.id === i.carId)
  }));
  res.json(installments);
});

router.post("/", authMiddleware, adminMiddleware, (req, res) => {
  const user = (req as any).user;
  const installment = InstallmentService.createInstallment(user.id, req.body);
  res.status(201).json(installment);
});

router.get("/:id/payments", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const payments = db.installmentPayments.filter(p => p.installmentId === id);
  res.json(payments);
});

router.post("/:id/payments", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  try {
    const payment = InstallmentService.addPayment(user.id, id, req.body);
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export { router as installmentRoutes };
