import { db } from "../db/mockDb.js";
import { VehicleInstallment, InstallmentPayment, Expense, FinancialLog } from "../../types.js";
import { financialEvents, FINANCIAL_EVENTS } from "../events/financial.events.js";

export class FinancialService {
  static async logAction(userId: number, action: string, description: string) {
    const log: FinancialLog = {
      id: db.financialLogs.length + 1,
      userId,
      action,
      description,
      createdAt: new Date().toISOString(),
    };
    db.financialLogs.push(log);
    return log;
  }

  // Installments
  static getInstallments() {
    return db.vehicleInstallments.map(i => ({
      ...i,
      car: db.cars.find(c => c.id === i.carId)
    }));
  }

  static addInstallment(data: Omit<VehicleInstallment, 'id' | 'remainingAmount'>) {
    const installment: VehicleInstallment = {
      ...data,
      id: db.vehicleInstallments.length + 1,
      remainingAmount: data.totalAmount,
    };
    db.vehicleInstallments.push(installment);
    return installment;
  }

  static addInstallmentPayment(userId: number, data: Omit<InstallmentPayment, 'id' | 'paymentDate'>) {
    const installment = db.vehicleInstallments.find(i => i.id === data.installmentId);
    if (!installment) throw new Error("Traite non trouvée");

    if (data.amount > installment.remainingAmount) {
      throw new Error("Le montant du paiement ne peut pas dépasser le montant restant");
    }

    const payment: InstallmentPayment = {
      ...data,
      id: db.installmentPayments.length + 1,
      paymentDate: new Date().toISOString(),
    };

    db.installmentPayments.push(payment);

    // Update installment
    installment.remainingAmount -= data.amount;
    if (installment.remainingAmount === 0) {
      installment.status = 'terminé';
    }

    this.logAction(userId, "INSTALLMENT_PAYMENT", `Paiement de ${data.amount} DH pour la traite #${installment.id}`);
    financialEvents.emit(FINANCIAL_EVENTS.INSTALLMENT_PAID, { installment, payment });

    return payment;
  }

  // Expenses
  static getExpenses() {
    return db.expenses;
  }

  static addExpense(data: Omit<Expense, 'id'>) {
    const expense: Expense = {
      ...data,
      id: db.expenses.length + 1,
    };
    db.expenses.push(expense);
    return expense;
  }

  static updateExpenseStatus(userId: number, id: number, status: 'payé' | 'en_attente', paymentDate?: string) {
    const expense = db.expenses.find(e => e.id === id);
    if (!expense) throw new Error("Charge non trouvée");

    expense.status = status;
    if (status === 'payé') {
      expense.paymentDate = paymentDate || new Date().toISOString();
      financialEvents.emit(FINANCIAL_EVENTS.EXPENSE_PAID, { expense });
    }

    this.logAction(userId, "EXPENSE_UPDATE", `Charge #${id} marquée comme ${status}`);
    return expense;
  }

  static deleteExpense(userId: number, id: number) {
    const user = db.users.find(u => u.id === userId);
    if (user?.role !== 'admin') throw new Error("Seul l'administrateur peut supprimer des charges");

    const index = db.expenses.findIndex(e => e.id === id);
    if (index === -1) throw new Error("Charge non trouvée");

    db.expenses.splice(index, 1);
    this.logAction(userId, "EXPENSE_DELETE", `Charge #${id} supprimée`);
    return true;
  }

  // Financial Dashboard Stats
  static getStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRevenue = db.payments
      .filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyExpenses = db.expenses
      .filter(e => {
        const d = new Date(e.paymentDate || e.dueDate);
        return e.status === 'payé' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const totalRemainingInstallments = db.vehicleInstallments
      .reduce((sum, i) => sum + i.remainingAmount, 0);

    const pendingReimbursements = db.incidents
      .filter(i => i.paymentStatus === 'en_attente' || i.paymentStatus === 'partiel')
      .reduce((sum, i) => sum + (i.remainingBalance || 0), 0);

    return {
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      pendingReimbursements,
      totalRemainingInstallments,
    };
  }
}
