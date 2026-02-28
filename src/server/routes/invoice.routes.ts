import express from "express";
import { db } from "../db.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import fs from "fs";

const router = express.Router();

// Get all invoices
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM invoices ORDER BY created_at DESC`
    );
    res.json(rows);

  } catch (error) {
    console.error("Fetch invoices error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Download invoice PDF
router.get("/:id/download", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[invoice]] = await db.query(
      `SELECT * FROM invoices WHERE id = ?`,
      [id]
    );

    if (!invoice || !invoice.pdf_path) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    if (!fs.existsSync(invoice.pdf_path)) {
      return res.status(404).json({ message: "Fichier PDF manquant" });
    }

    res.download(invoice.pdf_path);

  } catch (error) {
    console.error("Download invoice error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Delete invoice
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[invoice]] = await db.query(
      `SELECT * FROM invoices WHERE id = ?`,
      [id]
    );

    if (!invoice) {
      return res.status(404).json({ message: "Facture non trouvée" });
    }

    if (invoice.pdf_path && fs.existsSync(invoice.pdf_path)) {
      fs.unlinkSync(invoice.pdf_path);
    }

    await db.query(`DELETE FROM invoices WHERE id = ?`, [id]);

    res.status(204).send();

  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as invoiceRoutes };