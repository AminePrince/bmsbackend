import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware.js";
import { InsuranceIntegrationService } from "../services/insurance.service.js";

const router = express.Router();

// Insurance Companies CRUD
router.get("/companies", authMiddleware, (req, res) => {
  res.json(db.insuranceCompanies);
});

router.post("/companies", authMiddleware, adminMiddleware, (req, res) => {
  const newCompany = {
    ...req.body,
    id: db.insuranceCompanies.length + 1,
    createdAt: new Date().toISOString()
  };
  db.insuranceCompanies.push(newCompany);
  res.status(201).json(newCompany);
});

router.put("/companies/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.insuranceCompanies.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ message: "Compagnie non trouvée" });
  
  db.insuranceCompanies[index] = { ...db.insuranceCompanies[index], ...req.body };
  res.json(db.insuranceCompanies[index]);
});

// Insurance Integration Actions
router.post("/assistances/:id/send-claim", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await InsuranceIntegrationService.sendAssistanceRequest(id);
  if (!result) return res.status(404).json({ message: "Assistance non trouvée ou pas d'assurance liée" });
  res.json(result);
});

router.post("/assistances/:id/sync", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await InsuranceIntegrationService.syncClaimUpdates(id);
  if (!result) return res.status(404).json({ message: "Assistance non trouvée" });
  res.json(result);
});

router.get("/logs", authMiddleware, adminMiddleware, (req, res) => {
  res.json(db.insuranceLogs);
});

export { router as insuranceRoutes };
