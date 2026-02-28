import { db } from "../db/mockDb.js";
import { subMonths, startOfMonth, endOfMonth, format, isWithinInterval } from "date-fns";

export class AnalyticsService {
  static getStats() {
    const totalRevenue = db.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalRentals = db.rentals.length;
    const activeRentals = db.rentals.filter(r => r.status === 'active').length;
    const totalCars = db.cars.length;
    const utilizationRate = totalCars > 0 ? (activeRentals / totalCars) * 100 : 0;

    // Monthly revenue for last 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const revenue = db.payments
        .filter(p => {
          const pDate = new Date(p.paymentDate);
          return isWithinInterval(pDate, { start, end });
        })
        .reduce((sum, p) => sum + p.amount, 0);

      monthlyRevenue.push({
        month: format(date, 'MMM'),
        revenue
      });
    }

    // Top Clients
    const clientStats = db.clients.map(client => {
      const rentals = db.rentals.filter(r => r.clientId === client.id);
      const revenue = rentals.reduce((sum, r) => sum + r.totalPrice, 0);
      return {
        name: client.fullName,
        rentals: rentals.length,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Car Utilization
    const carStats = db.cars.map(car => {
      const rentals = db.rentals.filter(r => r.carId === car.id);
      return {
        name: `${car.brand} ${car.model}`,
        rentals: rentals.length
      };
    }).sort((a, b) => b.rentals - a.rentals).slice(0, 5);

    return {
      totalRevenue,
      totalRentals,
      activeRentals,
      utilizationRate,
      monthlyRevenue,
      topClients: clientStats,
      topCars: carStats
    };
  }
}
