import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { CarAvailabilityService } from "../services/availability.service.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const { search, status } = req.query;
  let cars = [...db.cars];

  if (search) {
    const s = String(search).toLowerCase();
    cars = cars.filter(c => 
      c.brand.toLowerCase().includes(s) || 
      c.model.toLowerCase().includes(s) || 
      c.licensePlate.toLowerCase().includes(s)
    );
  }

  if (status) {
    cars = cars.filter(c => c.status === status);
  }

  // Add availability info
  const carsWithAvailability = cars.map(car => ({
    ...car,
    nextAvailableDate: CarAvailabilityService.calculateNextAvailable(car.id),
    isAvailableToday: CarAvailabilityService.isAvailableToday(car.id)
  }));

  res.json(carsWithAvailability);
});

router.post("/", authMiddleware, (req, res) => {
  const newCar = {
    ...req.body,
    id: db.cars.length > 0 ? Math.max(...db.cars.map(c => c.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  db.cars.push(newCar);
  res.status(201).json(newCar);
});

router.put("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.cars.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ message: "Voiture non trouvée" });
  
  db.cars[index] = { ...db.cars[index], ...req.body };
  res.json(db.cars[index]);
});

router.delete("/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const index = db.cars.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ message: "Voiture non trouvée" });
  
  db.cars.splice(index, 1);
  res.status(204).send();
});

export { router as carRoutes };
