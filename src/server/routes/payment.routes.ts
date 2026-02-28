import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM payments ORDER BY payment_date DESC`
    );
    res.json(rows);

  } catch (error) {
    console.error("Fetch payments error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { rentalId, amount, method, notes } = req.body;

    const [[rental]] = await db.query(
      `SELECT id FROM rentals WHERE id=?`,
      [rentalId]
    );

    if (!rental)
      return res.status(404).json({ message: "Location non trouvée" });

    const [result] = await db.query(
      `
      INSERT INTO payments
      (rental_id, amount, method, notes, payment_date)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [rentalId, amount, method, notes || ""]
    );

    const [[newPayment]] = await db.query(
      `SELECT * FROM payments WHERE id=?`,
      [result.insertId]
    );

    res.status(201).json(newPayment);

  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as paymentRoutes };