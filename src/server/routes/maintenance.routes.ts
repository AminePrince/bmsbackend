import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createActivityLog } from "../middleware/activity.middleware.js";
import { createNotification } from "./notification.routes.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.*,
        c.id as carId,
        c.brand,
        c.model,
        c.license_plate
      FROM maintenances m
      LEFT JOIN cars c ON c.id = m.car_id
      ORDER BY m.created_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("Fetch maintenances error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { carId, type, description, cost, date, nextDueDate, status } = req.body;
    const user = req.user;

    const [result] = await db.query(
      `
      INSERT INTO maintenances
      (car_id, type, description, cost, date, next_due_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [carId, type, description, cost, date, nextDueDate, status]
    );

    const maintenanceId = result.insertId;

    if (status === "en_cours") {
      await db.query(`UPDATE cars SET status='maintenance' WHERE id=?`, [carId]);
    }

    createActivityLog(
      user.id,
      "CREATE",
      "MAINTENANCE",
      `Nouvelle maintenance #${maintenanceId} pour le véhicule #${carId}`,
      req.ip
    );

    const [admins] = await db.query(`SELECT id FROM users WHERE role='admin'`);
    for (const admin of admins as any[]) {
      createNotification(
        admin.id,
        "Maintenance Programmée",
        `Une maintenance de type ${type} a été enregistrée pour le véhicule #${carId}`,
        "maintenance"
      );
    }

    const [[newMaintenance]] = await db.query(
      `SELECT * FROM maintenances WHERE id=?`,
      [maintenanceId]
    );

    res.status(201).json(newMaintenance);

  } catch (error) {
    console.error("Create maintenance error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const user = req.user;

    const [[maintenance]] = await db.query(
      `SELECT * FROM maintenances WHERE id=?`,
      [id]
    );

    if (!maintenance)
      return res.status(404).json({ message: "Maintenance non trouvée" });

    const oldStatus = maintenance.status;

    await db.query(`UPDATE maintenances SET status=? WHERE id=?`, [status, id]);

    if (oldStatus === "en_cours" && status === "terminé") {
      await db.query(`UPDATE cars SET status='available' WHERE id=?`, [
        maintenance.car_id
      ]);
    }

    createActivityLog(
      user.id,
      "UPDATE",
      "MAINTENANCE",
      `Maintenance #${id} marquée comme ${status}`,
      req.ip
    );

    const [[updated]] = await db.query(
      `SELECT * FROM maintenances WHERE id=?`,
      [id]
    );

    res.json(updated);

  } catch (error) {
    console.error("Update maintenance error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as maintenanceRoutes };