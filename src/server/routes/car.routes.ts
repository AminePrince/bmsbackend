import express from "express";
import { db } from "../db.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =====================================================
   GET ALL CARS
===================================================== */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT 
        c.id,
        c.brand,
        c.model,
        c.year,
        c.license_plate,
        c.color,
        c.price_per_day,
        c.status,
        c.mileage,
        c.fuel_type,
        c.transmission,
        c.image_url,
        c.insurance_expiry,
        c.registration_expiry,
        c.inspection_expiry,
        c.created_at,

        (
          SELECT MIN(r.end_date)
          FROM rentals r
          WHERE r.car_id = c.id
          AND r.end_date >= CURDATE()
        ) AS nextAvailableDate,

        NOT EXISTS (
          SELECT 1
          FROM rentals r
          WHERE r.car_id = c.id
          AND CURDATE() BETWEEN r.start_date AND r.end_date
        ) AS isAvailableToday

      FROM cars c
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          LOWER(c.brand) LIKE ?
          OR LOWER(c.model) LIKE ?
          OR LOWER(c.license_plate) LIKE ?
        )
      `;
      const s = `%${String(search).toLowerCase()}%`;
      params.push(s, s, s);
    }

    if (status) {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const [rows] = await db.query(sql, params);

    // 🔥 Mapping snake_case → camelCase
    const cars = rows.map((row) => ({
      id: row.id,
      brand: row.brand,
      model: row.model,
      year: row.year,
      licensePlate: row.license_plate,
      color: row.color,
      pricePerDay: row.price_per_day,
      status: row.status,
      mileage: row.mileage,
      fuelType: row.fuel_type,
      transmission: row.transmission,
      imageUrl: row.image_url,
      insuranceExpiry: row.insurance_expiry,
      registrationExpiry: row.registration_expiry,
      inspectionExpiry: row.inspection_expiry,
      createdAt: row.created_at,
      nextAvailableDate: row.nextAvailableDate,
      isAvailableToday: !!row.isAvailableToday,
    }));

    res.json(cars);

  } catch (error) {
    console.error("Cars fetch error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


/* =====================================================
   CREATE CAR
===================================================== */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      brand,
      model,
      licensePlate,
      year,
      color,
      pricePerDay,
      mileage,
      fuelType,
      transmission,
      imageUrl,
      insuranceExpiry,
      registrationExpiry,
      inspectionExpiry
    } = req.body;

    const [result] = await db.query(
      `
      INSERT INTO cars (
        brand, model, license_plate, year,
        color, price_per_day, status,
        mileage, fuel_type, transmission,
        image_url,
        insurance_expiry, registration_expiry, inspection_expiry,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        brand,
        model,
        licensePlate,
        year,
        color,
        pricePerDay,
        mileage || 0,
        fuelType,
        transmission,
        imageUrl,
        insuranceExpiry,
        registrationExpiry,
        inspectionExpiry
      ]
    );

    const [[newCar]] = await db.query(
      `SELECT * FROM cars WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(newCar);

  } catch (error) {
    console.error("Car create error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


/* =====================================================
   UPDATE CAR (SAFE VERSION)
===================================================== */
router.post("/:id", authMiddleware, async (req, res) => {
  console.log(req.body);
  try {
    const id = parseInt(req.params.id);

    const allowedFields = {
      brand: "brand",
      model: "model",
      year: "year",
      color: "color",
      licensePlate: "license_plate",
      pricePerDay: "price_per_day",
      mileage: "mileage",
      fuelType: "fuel_type",
      transmission: "transmission",
      imageUrl: "image_url",
      insuranceExpiry: "insurance_expiry",
      registrationExpiry: "registration_expiry",
      inspectionExpiry: "inspection_expiry",
      status: "status"
    };

    const updates = [];
    const values = [];

    for (const key in req.body) {
      if (allowedFields[key]) {
        updates.push(`${allowedFields[key]} = ?`);
        values.push(req.body[key]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Aucune donnée valide" });
    }

    values.push(id);

    await db.query(
      `UPDATE cars SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const [[updated]] = await db.query(
      `SELECT * FROM cars WHERE id = ?`,
      [id]
    );

    res.json(updated);

  } catch (error) {
    console.error("Car update error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


/* =====================================================
   DELETE CAR
===================================================== */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[exists]] = await db.query(
      `SELECT id FROM cars WHERE id = ?`,
      [id]
    );

    if (!exists) {
      return res.status(404).json({ message: "Voiture non trouvée" });
    }

    await db.query(`DELETE FROM cars WHERE id = ?`, [id]);

    res.status(204).send();

  } catch (error) {
    console.error("Car delete error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export { router as carRoutes };