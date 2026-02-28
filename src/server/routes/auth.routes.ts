import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { createActivityLog } from "../middleware/activity.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
const JWT_SECRET = "bms-rider-secret-key-2024";

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [[user]] = await db.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: "Compte invalides" });
      
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Mot de passe invalides" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    createActivityLog(user.id, "LOGIN", "AUTH", `Connexion réussie de ${user.name}`, req.ip);

    delete user.password;

    res.json({ token, user });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      createActivityLog(user.id, "LOGOUT", "AUTH", `Déconnexion de ${user.name}`, req.ip);
    }
    res.status(204).send();

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as authRoutes };