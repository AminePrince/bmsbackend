import express from "express";
import { db } from "../db.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { InsuranceIntegrationService } from "../services/insurance.service.js";

const router = express.Router();

// Companies list
router.get("/companies", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM insurance_companies ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) {
    console.error("Fetch companies error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Create company
router.post("/companies", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, contact_email, contact_phone, api_endpoint } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO insurance_companies
      (name, contact_email, contact_phone, api_endpoint, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [name, contact_email, contact_phone, api_endpoint]
    );

    const [[company]] = await db.query(
      `SELECT * FROM insurance_companies WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(company);

  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Update company
router.put("/companies/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[exists]] = await db.query(`SELECT id FROM insurance_companies WHERE id=?`, [id]);
    if (!exists) return res.status(404).json({ message: "Compagnie non trouvée" });

    const fields = [];
    const values = [];

    for (const key in req.body) {
      fields.push(`${key}=?`);
      values.push(req.body[key]);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    values.push(id);

    await db.query(
      `UPDATE insurance_companies SET ${fields.join(",")} WHERE id=?`,
      values
    );

    const [[updated]] = await db.query(
      `SELECT * FROM insurance_companies WHERE id=?`,
      [id]
    );

    res.json(updated);

  } catch (error) {
    console.error("Update company error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Send claim
router.post("/assistances/:id/send-claim", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await InsuranceIntegrationService.sendAssistanceRequest(id);
    if (!result)
      return res.status(404).json({ message: "Assistance non trouvée ou pas d'assurance liée" });

    res.json(result);

  } catch (error) {
    console.error("Send claim error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Sync claim
router.post("/assistances/:id/sync", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await InsuranceIntegrationService.syncClaimUpdates(id);
    if (!result)
      return res.status(404).json({ message: "Assistance non trouvée" });

    res.json(result);

  } catch (error) {
    console.error("Sync claim error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Logs
router.get("/logs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT * FROM insurance_logs ORDER BY created_at DESC`
    );
    res.json(logs);

  } catch (error) {
    console.error("Fetch logs error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as insuranceRoutes };