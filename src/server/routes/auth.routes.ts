import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../db/mockDb.js";

import { createActivityLog } from "../middleware/activity.middleware.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
const JWT_SECRET = "bms-rider-secret-key-2024";

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password!)) {
    return res.status(401).json({ message: "Identifiants invalides" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  createActivityLog(user.id, "LOGIN", "AUTH", `Connexion réussie de ${user.name}`, req.ip);

  const { password: _unused, ...userWithoutPassword } = user;
  console.log(_unused ? 'Login successful' : '');
  res.json({ token, user: userWithoutPassword });
});

router.post("/logout", authMiddleware, (req, res) => {
  const user = (req as any).user;
  if (user) {
    createActivityLog(user.id, "LOGOUT", "AUTH", `Déconnexion de ${user.name}`, req.ip);
  }
  res.status(204).send();
});

export { router as authRoutes };
