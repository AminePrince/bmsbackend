import { db } from "../db/mockDb.js";
import { FinancialLog } from "../../types.js";

export class FinanceService {
  static log(userId: number, action: string, description: string) {
    const log: FinancialLog = {
      id: db.financialLogs.length + 1,
      userId,
      action,
      description,
      createdAt: new Date().toISOString()
    };
    db.financialLogs.push(log);
    return log;
  }

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
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.status === 'payé';
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const totalRemainingInstallments = db.vehicleInstallments
      .reduce((sum, i) => sum + i.remainingAmount, 0);

    const pendingReimbursements = db.incidents
      .filter(i => i.type === 'sinistre' && i.insurancePaymentStatus !== 'payé')
      .reduce((sum, i) => sum + (i.reimbursementAmount || 0), 0);

    return {
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses,
      pendingReimbursements,
      totalRemainingInstallments
    };
  }
}
