import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { FinancialService } from "../services/financial.service.js";
import { db } from "../db/mockDb.js";

const router = express.Router();

// Dashboard Stats
router.get("/stats", authMiddleware, (req, res) => {
  res.json(FinancialService.getStats());
});

// Installments
router.get("/installments", authMiddleware, (req, res) => {
  res.json(FinancialService.getInstallments());
});

router.post("/installments", authMiddleware, (req, res) => {
  const installment = FinancialService.addInstallment(req.body);
  res.status(201).json(installment);
});

router.post("/installments/:id/payments", authMiddleware, (req, res) => {
  try {
    const payment = FinancialService.addInstallmentPayment(req.user!.id, {
      ...req.body,
      installmentId: parseInt(req.params.id)
    });
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Expenses
router.get("/expenses", authMiddleware, (req, res) => {
  const { category, month, status } = req.query;
  let expenses = FinancialService.getExpenses();

  if (category) expenses = expenses.filter(e => e.category === category);
  if (status) expenses = expenses.filter(e => e.status === status);
  if (month) {
    expenses = expenses.filter(e => {
      const d = new Date(e.dueDate);
      return (d.getMonth() + 1).toString() === month;
    });
  }

  res.json(expenses);
});

router.post("/expenses", authMiddleware, (req, res) => {
  const expense = FinancialService.addExpense(req.body);
  res.status(201).json(expense);
});

router.patch("/expenses/:id/status", authMiddleware, (req, res) => {
  try {
    const expense = FinancialService.updateExpenseStatus(req.user!.id, parseInt(req.params.id), req.body.status, req.body.paymentDate);
    res.json(expense);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/expenses/:id", authMiddleware, (req, res) => {
  try {
    FinancialService.deleteExpense(req.user!.id, parseInt(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    res.status(403).json({ message: err.message });
  }
});

// Claims (Sinistres)
router.get("/claims", authMiddleware, (req, res) => {
  const claims = db.incidents.map(i => ({
    ...i,
    rental: db.rentals.find(r => r.id === i.rentalId),
  }));
  res.json(claims);
});

router.patch("/claims/:id", authMiddleware, (req, res) => {
  const claim = db.incidents.find(i => i.id === parseInt(req.params.id));
  if (!claim) return res.status(404).json({ message: "Sinistre non trouvé" });

  Object.assign(claim, req.body);
  
  // Auto recalc balance if reimbursement added
  if (req.body.reimbursementAmount !== undefined) {
    claim.remainingBalance = claim.amount - (claim.reimbursementAmount || 0);
    if (claim.remainingBalance <= 0) {
      claim.paymentStatus = 'payé';
    } else if (claim.reimbursementAmount > 0) {
      claim.paymentStatus = 'partiel';
    } else {
      claim.paymentStatus = 'en_attente';
    }
  }

  res.json(claim);
});

export { router as financialRoutes };
