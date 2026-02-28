import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createActivityLog } from "../middleware/activity.middleware.js";
import { createNotification } from "./notification.routes.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [incidents] = await db.query(`
      SELECT 
        i.*,
        r.id as rentalId,
        r.car_id,
        r.client_id,
        r.start_date,
        r.end_date
      FROM incidents i
      LEFT JOIN rentals r ON r.id = i.rental_id
      ORDER BY i.created_at DESC
    `);

    res.json(incidents);

  } catch (error) {
    console.error("Incidents fetch error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { rentalId, type, description, amount, status, date } = req.body;
    const user = req.user;

    const [result] = await db.query(
      `
      INSERT INTO incidents 
      (rental_id, type, description, amount, status, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [rentalId, type, description, amount, status, date]
    );

    const incidentId = result.insertId;

    createActivityLog(user.id, "CREATE", "INCIDENT", `Nouvel incident #${incidentId} pour la location #${rentalId}`, req.ip);

    const [admins] = await db.query(`SELECT id FROM users WHERE role='admin'`);

    for (const admin of admins as any[]) {
      createNotification(
        admin.id,
        "Nouvel Incident",
        `Un incident de type ${type} a été signalé pour la location #${rentalId}`,
        "rental"
      );
    }

    const [[newIncident]] = await db.query(
      `SELECT * FROM incidents WHERE id = ?`,
      [incidentId]
    );

    res.status(201).json(newIncident);

  } catch (error) {
    console.error("Incident create error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, description, amount } = req.body;
    const user = req.user;

    const [[exists]] = await db.query(`SELECT id FROM incidents WHERE id = ?`, [id]);
    if (!exists) return res.status(404).json({ message: "Incident non trouvé" });

    const fields = [];
    const values = [];

    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }

    if (amount !== undefined) {
      fields.push("amount = ?");
      values.push(amount);
    }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE incidents SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    createActivityLog(user.id, "UPDATE", "INCIDENT", `Mise à jour de l'incident #${id}`, req.ip);

    const [[updated]] = await db.query(`SELECT * FROM incidents WHERE id = ?`, [id]);

    res.json(updated);

  } catch (error) {
    console.error("Incident update error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as incidentRoutes };