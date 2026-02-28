import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "storage", "app", "private", "documents");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Format non supporté (PDF, JPG, PNG uniquement)"));
  }
});

// Upload
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucun fichier téléchargé" });

    const { rentalId, type } = req.body;
    const user = req.user;

    const [result] = await db.query(
      `
      INSERT INTO documents (rental_id, type, file_path, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [parseInt(rentalId), type, req.file.path, user.id]
    );

    const [[doc]] = await db.query(
      `SELECT * FROM documents WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(doc);

  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Get docs by rental
router.get("/rental/:rentalId", authMiddleware, async (req, res) => {
  try {
    const rentalId = parseInt(req.params.rentalId);

    const [docs] = await db.query(
      `SELECT * FROM documents WHERE rental_id = ? ORDER BY created_at DESC`,
      [rentalId]
    );

    res.json(docs);

  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Download
router.get("/:id/download", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[doc]] = await db.query(
      `SELECT * FROM documents WHERE id = ?`,
      [id]
    );

    if (!doc) return res.status(404).json({ message: "Document non trouvé" });
    if (!fs.existsSync(doc.file_path))
      return res.status(404).json({ message: "Fichier manquant" });

    res.download(doc.file_path);

  } catch (error) {
    console.error("Download document error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Delete
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[doc]] = await db.query(
      `SELECT * FROM documents WHERE id = ?`,
      [id]
    );

    if (!doc) return res.status(404).json({ message: "Document non trouvé" });

    if (fs.existsSync(doc.file_path)) fs.unlinkSync(doc.file_path);

    await db.query(`DELETE FROM documents WHERE id = ?`, [id]);

    res.status(204).send();

  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as documentRoutes };