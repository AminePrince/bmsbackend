import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createActivityLog } from "../middleware/activity.middleware.js";
import { createNotification } from "./notification.routes.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const maintenances = db.maintenances.map(m => ({
    ...m,
    car: db.cars.find(c => c.id === m.carId)
  }));
  res.json(maintenances);
});

router.post("/", authMiddleware, (req, res) => {
  const { carId, type, description, cost, date, nextDueDate, status } = req.body;
  const user = (req as any).user;

  const newMaintenance = {
    id: db.maintenances.length > 0 ? Math.max(...db.maintenances.map(m => m.id)) + 1 : 1,
    carId,
    type,
    description,
    cost,
    date,
    nextDueDate,
    status,
    createdAt: new Date().toISOString()
  };

  db.maintenances.push(newMaintenance);

  // If status is 'en_cours', mark car as maintenance
  if (status === 'en_cours') {
    const car = db.cars.find(c => c.id === carId);
    if (car) car.status = 'maintenance';
  }

  createActivityLog(user.id, "CREATE", "MAINTENANCE", `Nouvelle maintenance #${newMaintenance.id} pour le véhicule #${carId}`, req.ip);
  
  // Notify admins
  db.users.filter(u => u.role === 'admin').forEach(admin => {
    createNotification(admin.id, "Maintenance Programmée", `Une maintenance de type ${type} a été enregistrée pour le véhicule #${carId}`, 'maintenance');
  });

  res.status(201).json(newMaintenance);
});

router.patch("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const user = (req as any).user;
  const maintenance = db.maintenances.find(m => m.id === id);

  if (!maintenance) return res.status(404).json({ message: "Maintenance non trouvée" });

  const oldStatus = maintenance.status;
  maintenance.status = status;

  if (oldStatus === 'en_cours' && status === 'terminé') {
    const car = db.cars.find(c => c.id === maintenance.carId);
    if (car) car.status = 'available';
  }

  createActivityLog(user.id, "UPDATE", "MAINTENANCE", `Maintenance #${id} marquée comme ${status}`, req.ip);
  res.json(maintenance);
});

export { router as maintenanceRoutes };
