import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const { search } = req.query;
  let clients = [...db.clients];

  if (search) {
    const s = String(search).toLowerCase();
    clients = clients.filter(c => 
      c.fullName.toLowerCase().includes(s) || 
      c.phone.includes(s) || 
      c.email?.toLowerCase().includes(s)
    );
  }

  res.json(clients);
});

router.post("/", authMiddleware, (req, res) => {
  const newClient = {
    ...req.body,
    id: db.clients.length > 0 ? Math.max(...db.clients.map(c => c.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  db.clients.push(newClient);
  res.status(201).json(newClient);
});

router.put("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.clients.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ message: "Client non trouvé" });
  
  db.clients[index] = { ...db.clients[index], ...req.body };
  res.json(db.clients[index]);
});

router.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.clients.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ message: "Client non trouvé" });
  
  db.clients.splice(index, 1);
  res.status(204).send();
});

export { router as clientRoutes };
