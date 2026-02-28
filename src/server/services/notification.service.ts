import { db } from "../db/mockDb.js";
import { Notification } from "../../types.js";
import { addDays, isBefore, parseISO, differenceInDays } from "date-fns";

export class NotificationService {
  static async createNotification(userId: number, title: string, message: string, type: Notification['type']) {
    const notification: Notification = {
      id: db.notifications.length + 1,
      userId,
      title,
      message,
      read: false,
      type,
      createdAt: new Date().toISOString(),
    };
    db.notifications.push(notification);
    return notification;
  }

  static async checkDeadlines() {
    const now = new Date();
    const admins = db.users.filter(u => u.role === 'admin');

    for (const admin of admins) {
      // 1. Installments due in 5 days
      db.vehicleInstallments
        .filter(i => i.status === 'actif')
        .forEach(i => {
          const dueDate = parseISO(i.nextDueDate);
          const daysDiff = differenceInDays(dueDate, now);
          if (daysDiff >= 0 && daysDiff <= 5) {
            this.createNotification(admin.id, "Échéance Traite", `La traite pour ${i.lenderName} arrive à échéance dans ${daysDiff} jours.`, 'payment');
          }
        });

      // 2. Expenses due in 3 days
      db.expenses
        .filter(e => e.status === 'en_attente')
        .forEach(e => {
          const dueDate = parseISO(e.dueDate);
          const daysDiff = differenceInDays(dueDate, now);
          if (daysDiff >= 0 && daysDiff <= 3) {
            this.createNotification(admin.id, "Échéance Charge", `La charge "${e.title}" doit être payée dans ${daysDiff} jours.`, 'payment');
          }
        });

      // 3. Insurance reimbursement pending > 7 days
      db.incidents
        .filter(i => i.paymentStatus === 'en_attente' && i.reimbursementExpectedDate)
        .forEach(i => {
          const expectedDate = parseISO(i.reimbursementExpectedDate!);
          if (isBefore(expectedDate, addDays(now, -7))) {
            this.createNotification(admin.id, "Retard Remboursement", `Le remboursement pour le sinistre #${i.id} est en retard de plus de 7 jours.`, 'document');
          }
        });

      // 4. Maintenance due
      db.maintenances
        .filter(m => m.status === 'en_cours')
        .forEach(m => {
          const dueDate = parseISO(m.nextDueDate);
          if (isBefore(dueDate, addDays(now, 2))) {
            this.createNotification(admin.id, "Maintenance Prévue", `Une maintenance est prévue pour le véhicule #${m.carId}.`, 'maintenance');
          }
        });

      // 5. Document expiry
      db.cars.forEach(car => {
        if (car.insuranceExpiry && isBefore(parseISO(car.insuranceExpiry), addDays(now, 15))) {
          this.createNotification(admin.id, "Expiration Assurance", `L'assurance du véhicule ${car.brand} ${car.model} expire bientôt.`, 'document');
        }
      });
    }
  }
}
