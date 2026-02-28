import { db } from "../db/mockDb.js";
import { Expense } from "../../types.js";
import { FinanceService } from "./finance.service.js";

export class ExpenseService {
  static create(userId: number, data: Partial<Expense>) {
    const expense: Expense = {
      id: db.expenses.length + 1,
      title: data.title!,
      category: data.category!,
      amount: data.amount!,
      type: data.type!,
      dueDate: data.dueDate!,
      status: data.status || 'en_attente',
      note: data.note || '',
      createdAt: new Date().toISOString()
    };

    if (expense.status === 'payé') {
      expense.paymentDate = new Date().toISOString();
    }

    db.expenses.push(expense);
    FinanceService.log(userId, "EXPENSE_CREATE", `Création d'une charge: ${expense.title} (${expense.amount} DH)`);
    return expense;
  }

  static markAsPaid(userId: number, id: number) {
    const expense = db.expenses.find(e => e.id === id);
    if (!expense) throw new Error("Charge non trouvée");

    expense.status = 'payé';
    expense.paymentDate = new Date().toISOString();

    FinanceService.log(userId, "EXPENSE_PAID", `Charge payée: ${expense.title} (${expense.amount} DH)`);
    return expense;
  }
}
