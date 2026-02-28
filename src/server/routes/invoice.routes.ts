import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import fs from 'fs';

const router = express.Router();

// Get all invoices
router.get("/", authMiddleware, (req, res) => {
  res.json(db.invoices);
});

// Download invoice PDF
router.get("/:id/download", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const invoice = db.invoices.find(i => i.id === id);
  
  if (!invoice || !invoice.pdfPath) {
    return res.status(404).json({ message: "Facture non trouvée" });
  }

  if (!fs.existsSync(invoice.pdfPath)) {
    return res.status(404).json({ message: "Fichier PDF manquant" });
  }

  res.download(invoice.pdfPath);
});

// Delete invoice (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.invoices.findIndex(i => i.id === id);
  
  if (index === -1) return res.status(404).json({ message: "Facture non trouvée" });
  
  // Optionally delete file
  const invoice = db.invoices[index];
  if (invoice.pdfPath && fs.existsSync(invoice.pdfPath)) {
    fs.unlinkSync(invoice.pdfPath);
  }

  db.invoices.splice(index, 1);
  res.status(204).send();
});

export { router as invoiceRoutes };
