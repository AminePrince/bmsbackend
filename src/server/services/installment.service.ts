import { db } from "../db/mockDb.js";
import { VehicleInstallment, InstallmentPayment } from "../../types.js";
import { FinanceService } from "./finance.service.js";

export class InstallmentService {
  static addPayment(userId: number, installmentId: number, data: Partial<InstallmentPayment>) {
    const installment = db.vehicleInstallments.find(i => i.id === installmentId);
    if (!installment) throw new Error("Traite non trouvée");

    if (data.amount! > installment.remainingAmount) {
      throw new Error("Le montant du paiement ne peut pas dépasser le montant restant");
    }

    const payment: InstallmentPayment = {
      id: db.installmentPayments.length + 1,
      installmentId,
      amount: data.amount!,
      paymentDate: data.paymentDate || new Date().toISOString(),
      method: data.method || 'cash',
      note: data.note || '',
      createdAt: new Date().toISOString()
    };

    db.installmentPayments.push(payment);
    
    // Update installment
    installment.remainingAmount -= payment.amount;
    if (installment.remainingAmount <= 0) {
      installment.status = 'terminé';
    }

    FinanceService.log(userId, "INSTALLMENT_PAYMENT", `Paiement de ${payment.amount} DH pour la traite #${installmentId}`);
    
    return payment;
  }

  static createInstallment(userId: number, data: Partial<VehicleInstallment>) {
    const installment: VehicleInstallment = {
      id: db.vehicleInstallments.length + 1,
      carId: data.carId!,
      totalAmount: data.totalAmount!,
      monthlyAmount: data.monthlyAmount!,
      remainingAmount: data.totalAmount!,
      nextDueDate: data.nextDueDate!,
      endDate: data.endDate!,
      status: 'actif',
      lenderName: data.lenderName!,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    db.vehicleInstallments.push(installment);
    FinanceService.log(userId, "INSTALLMENT_CREATE", `Création d'une traite de ${installment.totalAmount} DH pour le véhicule #${installment.carId}`);
    return installment;
  }
}
