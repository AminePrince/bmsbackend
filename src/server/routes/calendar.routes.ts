import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { db } from "../db.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" });
    }

    const [rows] = await db.query(
      `
      SELECT 
        r.id,
        r.car_id,
        r.start_date,
        r.end_date,
        c.name as car_name,
        c.plate_number
      FROM rentals r
      JOIN cars c ON c.id = r.car_id
      WHERE r.start_date <= ? AND r.end_date >= ?
      ORDER BY r.start_date ASC
      `,
      [end, start]
    );

    res.json(rows);

  } catch (error) {
    console.error("Calendar error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/car/:id/availability", authMiddleware, async (req, res) => {
  try {
    const carId = parseInt(req.params.id);

    const [[next]] = await db.query(
      `
      SELECT end_date
      FROM rentals
      WHERE car_id = ?
      AND end_date >= CURDATE()
      ORDER BY end_date ASC
      LIMIT 1
      `,
      [carId]
    );

    const [[today]] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM rentals
      WHERE car_id = ?
      AND CURDATE() BETWEEN start_date AND end_date
      `,
      [carId]
    );

    res.json({
      car_id: carId,
      next_available_date: next ? next.end_date : null,
      is_available_today: today.count === 0
    });

  } catch (error) {
    console.error("Availability error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as calendarRoutes };