import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { differenceInDays, parseISO } from "date-fns";
import fs from "fs";
import path from "path";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        c.id as carId,
        c.brand,
        c.model,
        c.license_plate,
        cl.id as clientId,
        cl.full_name,
        cl.phone
      FROM rentals r
      LEFT JOIN cars c ON c.id = r.car_id
      LEFT JOIN clients cl ON cl.id = r.client_id
      ORDER BY r.created_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Fetch rentals error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { carId, clientId, startDate, endDate, deposit, notes } = req.body;

    const [[car]] = await db.query(`SELECT * FROM cars WHERE id=?`, [carId]);
    if (!car) return res.status(404).json({ message: "Voiture non trouvée" });
    if (car.status !== "available")
      return res.status(400).json({ message: "Voiture non disponible" });

    const days = Math.max(
      1,
      differenceInDays(parseISO(endDate), parseISO(startDate))
    );
    const totalPrice = days * car.price_per_day;

    const [result] = await db.query(
      `
      INSERT INTO rentals
      (car_id, client_id, start_date, end_date, price_per_day, total_price, deposit, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())
      `,
      [
        carId,
        clientId,
        startDate,
        endDate,
        car.price_per_day,
        totalPrice,
        deposit || 0,
        notes || ""
      ]
    );

    await db.query(`UPDATE cars SET status='rented' WHERE id=?`, [carId]);

    const rentalId = result.insertId;

    const amount = totalPrice;
    const tax = Math.round(amount * 0.2);
    const totalAmount = amount + tax;
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(
      rentalId
    ).padStart(4, "0")}`;

    const [invoiceResult] = await db.query(
      `
      INSERT INTO invoices
      (rental_id, invoice_number, amount, tax, total_amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'en_attente', NOW())
      `,
      [rentalId, invoiceNumber, amount, tax, totalAmount]
    );

    const [[rental]] = await db.query(`SELECT * FROM rentals WHERE id=?`, [
      rentalId
    ]);
    const [[client]] = await db.query(`SELECT * FROM clients WHERE id=?`, [
      clientId
    ]);

    generateInvoicePDF(
      {
        id: invoiceResult.insertId,
        rental_id: rentalId,
        invoice_number: invoiceNumber,
        amount,
        tax,
        total_amount: totalAmount
      },
      rental,
      car,
      client
    )
      .then(async (pdfPath) => {
        await db.query(
          `UPDATE invoices SET pdf_path=? WHERE id=?`,
          [pdfPath, invoiceResult.insertId]
        );
      })
      .catch((err) => console.error("PDF Gen Error:", err));

    res.status(201).json(rental);

  } catch (error) {
    console.error("Create rental error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/:id/signature", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { signature } = req.body;

    const [[rental]] = await db.query(`SELECT * FROM rentals WHERE id=?`, [
      id
    ]);
    if (!rental)
      return res.status(404).json({ message: "Location non trouvée" });

    const dir = path.join(
      process.cwd(),
      "storage",
      "app",
      "private",
      "signatures"
    );
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileName = `sig_${id}_${Date.now()}.png`;
    const filePath = path.join(dir, fileName);

    const base64Data = signature.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(filePath, base64Data, "base64");

    await db.query(
      `UPDATE rentals SET client_signature_path=? WHERE id=?`,
      [filePath, id]
    );

    res.json({ message: "Signature enregistrée", path: filePath });

  } catch (error) {
    console.error("Signature error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const [[rental]] = await db.query(`SELECT * FROM rentals WHERE id=?`, [
      id
    ]);
    if (!rental)
      return res.status(404).json({ message: "Location non trouvée" });

    if (status === "completed" && !rental.client_signature_path) {
      return res
        .status(400)
        .json({
          message:
            "La signature du client est requise pour clôturer le contrat"
        });
    }

    await db.query(`UPDATE rentals SET status=? WHERE id=?`, [status, id]);

    if (status === "completed" || status === "cancelled") {
      await db.query(`UPDATE cars SET status='available' WHERE id=?`, [
        rental.car_id
      ]);
    }

    const [[updated]] = await db.query(`SELECT * FROM rentals WHERE id=?`, [
      id
    ]);

    res.json(updated);

  } catch (error) {
    console.error("Update rental status error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as rentalRoutes };