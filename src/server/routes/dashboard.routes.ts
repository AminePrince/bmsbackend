import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const [[availableCars]] = await db.query(
      `SELECT COUNT(*) as count FROM cars WHERE status = 'available'`
    );

    const [[rentedCars]] = await db.query(
      `SELECT COUNT(*) as count FROM cars WHERE status = 'rented'`
    );

    const [[activeRentals]] = await db.query(
      `SELECT COUNT(*) as count FROM rentals WHERE status = 'active'`
    );

    const [[availableToday]] = await db.query(`
      SELECT COUNT(*) as count
      FROM cars c
      WHERE NOT EXISTS (
        SELECT 1
        FROM rentals r
        WHERE r.car_id = c.id
        AND CURDATE() BETWEEN r.start_date AND r.end_date
      )
    `);

    const [[totalCars]] = await db.query(
      `SELECT COUNT(*) as count FROM cars`
    );

    const [[pendingReimbursements]] = await db.query(
      `SELECT COUNT(*) as count FROM assistances WHERE reimbursement_status = 'pending'`
    );

    const [[activeClaims]] = await db.query(
      `SELECT COUNT(*) as count 
       FROM assistances 
       WHERE reimbursement_status IS NOT NULL 
       AND reimbursement_status != 'paid'`
    );

    const [[todayRevenue]] = await db.query(
      `SELECT IFNULL(SUM(amount),0) as total 
       FROM payments 
       WHERE DATE(payment_date) = CURDATE()`
    );

    const [[monthRevenue]] = await db.query(
      `SELECT IFNULL(SUM(amount),0) as total 
       FROM payments 
       WHERE YEAR(payment_date)=YEAR(CURDATE())
       AND MONTH(payment_date)=MONTH(CURDATE())`
    );

    res.json({
      availableCars: availableCars.count,
      rentedCars: rentedCars.count,
      activeRentals: activeRentals.count,
      todayRevenue: todayRevenue.total,
      monthRevenue: monthRevenue.total,
      availableToday: availableToday.count,
      unavailableToday: totalCars.count - availableToday.count,
      pendingReimbursements: pendingReimbursements.count,
      activeClaims: activeClaims.count
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as dashboardRoutes };