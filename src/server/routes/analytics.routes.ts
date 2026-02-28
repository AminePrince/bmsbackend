import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { db } from "../db.js";

const router = express.Router();

router.get("/overview", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[users]] = await db.query(`SELECT COUNT(*) as totalUsers FROM users`);
    const [[cars]] = await db.query(`SELECT COUNT(*) as totalCars FROM cars`);
    const [[rentals]] = await db.query(`SELECT COUNT(*) as totalRentals FROM rentals`);
    const [[revenue]] = await db.query(`
      SELECT IFNULL(SUM(amount),0) as totalRevenue 
      FROM payments 
      WHERE status = 'paid'
    `);

    const stats = {
      totalUsers: users.totalUsers,
      totalCars: cars.totalCars,
      totalRentals: rentals.totalRentals,
      totalRevenue: revenue.totalRevenue
    };

    res.json(stats);

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as analyticsRoutes };