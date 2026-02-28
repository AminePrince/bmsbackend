import express from "express";
import { db } from "../db/mockDb.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { differenceInDays, parseISO } from "date-fns";
import fs from 'fs';
import path from 'path';
import { generateInvoicePDF } from "../utils/pdfGenerator.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const rentals = db.rentals.map(r => ({
    ...r,
    car: db.cars.find(c => c.id === r.carId),
    client: db.clients.find(c => c.id === r.clientId)
  }));
  res.json(rentals);
});

router.post("/", authMiddleware, (req, res) => {
  const { carId, clientId, startDate, endDate, deposit, notes } = req.body;
  
  const car = db.cars.find(c => c.id === carId);
  if (!car) return res.status(404).json({ message: "Voiture non trouvée" });
  if (car.status !== 'available') return res.status(400).json({ message: "Voiture non disponible" });

  const days = Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)));
  const totalPrice = days * car.pricePerDay;

  const newRental = {
    id: db.rentals.length > 0 ? Math.max(...db.rentals.map(r => r.id)) + 1 : 1,
    carId,
    clientId,
    startDate,
    endDate,
    pricePerDay: car.pricePerDay,
    totalPrice,
    deposit: deposit || 0,
    status: 'active' as const,
    notes: notes || "",
    createdAt: new Date().toISOString()
  };

  // Update car status
  car.status = 'rented';
  
  db.rentals.push(newRental);

  // Automatic Invoice Generation
  const amount = totalPrice;
  const tax = Math.round(amount * 0.2);
  const totalAmount = amount + tax;
  const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(db.invoices.length + 1).padStart(4, '0')}`;
  
  const newInvoice = {
    id: db.invoices.length > 0 ? Math.max(...db.invoices.map(i => i.id)) + 1 : 1,
    rentalId: newRental.id,
    invoiceNumber,
    amount,
    tax,
    totalAmount,
    status: 'en_attente' as const,
    createdAt: new Date().toISOString()
  };

  const client = db.clients.find(c => c.id === clientId);
  if (client) {
    generateInvoicePDF(newInvoice, newRental, car, client).then(pdfPath => {
      newInvoice.pdfPath = pdfPath;
      db.invoices.push(newInvoice);
    }).catch(err => console.error("PDF Gen Error:", err));
  }

  res.status(201).json(newRental);
});

// Update signature
router.post("/:id/signature", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { signature } = req.body; // base64
  const rental = db.rentals.find(r => r.id === id);
  
  if (!rental) return res.status(404).json({ message: "Location non trouvée" });

  const dir = path.join(process.cwd(), 'storage', 'app', 'private', 'signatures');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const fileName = `sig_${id}_${Date.now()}.png`;
  const filePath = path.join(dir, fileName);
  
  const base64Data = signature.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(filePath, base64Data, 'base64');

  rental.clientSignaturePath = filePath;
  res.json({ message: "Signature enregistrée", path: filePath });
});

router.patch("/:id/status", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const rental = db.rentals.find(r => r.id === id);
  if (!rental) return res.status(404).json({ message: "Location non trouvée" });

  // Validation: Cannot complete without signature
  if (status === 'completed' && !rental.clientSignaturePath) {
    return res.status(400).json({ message: "La signature du client est requise pour clôturer le contrat" });
  }

  rental.status = status;

  // If completed or cancelled, free the car
  if (status === 'completed' || status === 'cancelled') {
    const car = db.cars.find(c => c.id === rental.carId);
    if (car) car.status = 'available';
  }

  res.json(rental);
});

export { router as rentalRoutes };
