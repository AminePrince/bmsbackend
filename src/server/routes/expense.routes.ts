import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { ExpenseService } from "../services/expense.service.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const { category, month, status } = req.query;
  let expenses = [...db.expenses];

  if (category) {
    expenses = expenses.filter(e => e.category === category);
  }

  if (status) {
    expenses = expenses.filter(e => e.status === status);
  }

  if (month) {
    expenses = expenses.filter(e => {
      const d = new Date(e.dueDate);
      return (d.getMonth() + 1).toString() === month;
    });
  }

  res.json(expenses);
});

router.post("/", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const expense = ExpenseService.create(user.id, req.body);
  res.status(201).json(expense);
});

router.patch("/:id/pay", authMiddleware, (req, res) => {
  const user = (req as any).user;
  const id = parseInt(req.params.id);
  try {
    const expense = ExpenseService.markAsPaid(user.id, id);
    res.json(expense);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.expenses.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ message: "Charge non trouvée" });
  
  db.expenses.splice(index, 1);
  res.status(204).send();
});

export { router as expenseRoutes };
