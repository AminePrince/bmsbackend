import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer for secure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'storage', 'app', 'private', 'documents');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté (PDF, JPG, PNG uniquement)'));
    }
  }
});

// Upload document
router.post("/upload", authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Aucun fichier téléchargé" });

  const { rentalId, type } = req.body;
  const user = (req as any).user;

  const newDoc = {
    id: db.documents.length > 0 ? Math.max(...db.documents.map(d => d.id)) + 1 : 1,
    rentalId: parseInt(rentalId),
    type: type as any,
    filePath: req.file.path,
    uploadedBy: user.id,
    createdAt: new Date().toISOString()
  };

  db.documents.push(newDoc);
  res.status(201).json(newDoc);
});

// Get documents for a rental
router.get("/rental/:rentalId", authMiddleware, (req, res) => {
  const rentalId = parseInt(req.params.rentalId);
  const docs = db.documents.filter(d => d.rentalId === rentalId);
  res.json(docs);
});

// Download document
router.get("/:id/download", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const doc = db.documents.find(d => d.id === id);
  
  if (!doc) return res.status(404).json({ message: "Document non trouvé" });
  if (!fs.existsSync(doc.filePath)) return res.status(404).json({ message: "Fichier manquant" });

  res.download(doc.filePath);
});

// Delete document
router.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.documents.findIndex(d => d.id === id);
  
  if (index === -1) return res.status(404).json({ message: "Document non trouvé" });
  
  const doc = db.documents[index];
  if (fs.existsSync(doc.filePath)) {
    fs.unlinkSync(doc.filePath);
  }

  db.documents.splice(index, 1);
  res.status(204).send();
});

export { router as documentRoutes };
