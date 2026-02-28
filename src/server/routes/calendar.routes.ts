import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { CarAvailabilityService } from "../services/availability.service.ts";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const { start, end } = req.query;
  
  if (!start || !end) {
    return res.status(400).json({ message: "Start and end dates are required" });
  }

  const calendar = CarAvailabilityService.getCalendar(String(start), String(end));
  res.json(calendar);
});

router.get("/car/:id/availability", authMiddleware, (req, res) => {
  const carId = parseInt(req.params.id);
  const nextAvailable = CarAvailabilityService.calculateNextAvailable(carId);
  const isAvailable = CarAvailabilityService.isAvailableToday(carId);
  
  res.json({
    car_id: carId,
    next_available_date: nextAvailable,
    is_available_today: isAvailable
  });
});

export { router as calendarRoutes };
