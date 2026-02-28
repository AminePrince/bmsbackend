import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isToday, isThisMonth, parseISO } from "date-fns";

import { CarAvailabilityService } from "../services/availability.service.js";

const router = express.Router();

router.get("/stats", authMiddleware, (req, res) => {
  const availableCars = db.cars.filter(c => c.status === 'available').length;
  const rentedCars = db.cars.filter(c => c.status === 'rented').length;
  const activeRentals = db.rentals.filter(r => r.status === 'active').length;
  
  const availableToday = db.cars.filter(c => CarAvailabilityService.isAvailableToday(c.id)).length;
  const unavailableToday = db.cars.length - availableToday;
  const pendingReimbursements = db.assistances.filter(a => a.reimbursementStatus === 'pending').length;
  const activeClaims = db.assistances.filter(a => a.reimbursementStatus && a.reimbursementStatus !== 'paid').length;

  const todayRevenue = db.payments
    .filter(p => isToday(parseISO(p.paymentDate)))
    .reduce((sum, p) => sum + p.amount, 0);

  const monthRevenue = db.payments
    .filter(p => isThisMonth(parseISO(p.paymentDate)))
    .reduce((sum, p) => sum + p.amount, 0);

  res.json({
    availableCars,
    rentedCars,
    activeRentals,
    todayRevenue,
    monthRevenue,
    availableToday,
    unavailableToday,
    pendingReimbursements,
    activeClaims
  });
});

export { router as dashboardRoutes };
