import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;

    let sql = `SELECT * FROM clients WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      sql += ` AND (
        LOWER(full_name) LIKE ?
        OR phone LIKE ?
        OR LOWER(email) LIKE ?
      )`;

      const s = `%${String(search).toLowerCase()}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY created_at DESC`;

    const [clients] = await db.query(sql, params);
    res.json(clients);

  } catch (error) {
    console.error("Clients fetch error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      address,
      licenseNumber,
      notes
    } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO clients 
      (full_name, phone, email, address, license_number, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [fullName, phone, email, address, licenseNumber, notes]
    );

    const [[newClient]] = await db.query(
      `SELECT * FROM clients WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(newClient);

  } catch (error) {
    console.error("Client create error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[exists]] = await db.query(`SELECT id FROM clients WHERE id = ?`, [id]);
    if (!exists) return res.status(404).json({ message: "Client non trouvé" });

    const fields = [];
    const values = [];

    for (const key in req.body) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    values.push(id);

    await db.query(
      `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    const [[updated]] = await db.query(`SELECT * FROM clients WHERE id = ?`, [id]);

    res.json(updated);

  } catch (error) {
    console.error("Client update error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[exists]] = await db.query(`SELECT id FROM clients WHERE id = ?`, [id]);
    if (!exists) return res.status(404).json({ message: "Client non trouvé" });

    await db.query(`DELETE FROM clients WHERE id = ?`, [id]);

    res.status(204).send();

  } catch (error) {
    console.error("Client delete error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as clientRoutes };