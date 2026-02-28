import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createActivityLog } from "../middleware/activity.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.*,
        c.id as clientId,
        c.name as clientName,
        r.id as rentalId,
        u.id as assigneeId,
        u.name as assigneeName
      FROM assistances a
      LEFT JOIN clients c ON c.id = a.client_id
      LEFT JOIN rentals r ON r.id = a.rental_id
      LEFT JOIN users u ON u.id = a.assigned_to
      ORDER BY a.created_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Assistances fetch error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { clientId, rentalId, issueType, description } = req.body;
    const user = req.user;

    const [result] = await db.query(
      `INSERT INTO assistances (client_id, rental_id, issue_type, description, status, created_at)
       VALUES (?, ?, ?, ?, 'nouveau', NOW())`,
      [clientId, rentalId, issueType, description]
    );

    const insertId = result.insertId;

    createActivityLog(user.id, "CREATE", "ASSISTANCE", `Nouvelle demande d'assistance #${insertId}`, req.ip);

    const [[newAssistance]] = await db.query(
      `SELECT * FROM assistances WHERE id = ?`,
      [insertId]
    );

    res.status(201).json(newAssistance);

  } catch (error) {
    console.error("Assistances create error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, assignedTo } = req.body;
    const user = req.user;

    const [[exists]] = await db.query(`SELECT id FROM assistances WHERE id = ?`, [id]);
    if (!exists) return res.status(404).json({ message: "Assistance non trouvée" });

    if (status) {
      await db.query(`UPDATE assistances SET status = ? WHERE id = ?`, [status, id]);
    }

    if (assignedTo) {
      await db.query(`UPDATE assistances SET assigned_to = ? WHERE id = ?`, [assignedTo, id]);
    }

    createActivityLog(user.id, "UPDATE", "ASSISTANCE", `Mise à jour de l'assistance #${id}`, req.ip);

    const [[updated]] = await db.query(`SELECT * FROM assistances WHERE id = ?`, [id]);

    res.json(updated);

  } catch (error) {
    console.error("Assistances update error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as assistanceRoutes };