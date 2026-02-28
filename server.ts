import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { authRoutes } from "./src/server/routes/auth.routes.js";
import { carRoutes } from "./src/server/routes/car.routes.js";
import { clientRoutes } from "./src/server/routes/client.routes.js";
import { rentalRoutes } from "./src/server/routes/rental.routes.js";
import { dashboardRoutes } from "./src/server/routes/dashboard.routes.js";
import { paymentRoutes } from "./src/server/routes/payment.routes.js";
import { invoiceRoutes } from "./src/server/routes/invoice.routes.js";
import { documentRoutes } from "./src/server/routes/document.routes.js";
import { activityRoutes } from "./src/server/routes/activity.routes.js";
import { incidentRoutes } from "./src/server/routes/incident.routes.js";
import { maintenanceRoutes } from "./src/server/routes/maintenance.routes.js";
import { notificationRoutes } from "./src/server/routes/notification.routes.js";
import { assistanceRoutes } from "./src/server/routes/assistance.routes.js";
import { analyticsRoutes } from "./src/server/routes/analytics.routes.js";
import { insuranceRoutes } from "./src/server/routes/insurance.routes.js";
import { calendarRoutes } from "./src/server/routes/calendar.routes.js";
import { financialRoutes } from "./src/server/routes/financial.routes.js";
import { NotificationService } from "./src/server/services/notification.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/cars", carRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/rentals", rentalRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/incidents", incidentRoutes);
  app.use("/api/maintenances", maintenanceRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/assistances", assistanceRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/insurance", insuranceRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/financial", financialRoutes);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Run deadline check daily (simulated every 24h)
    NotificationService.checkDeadlines();
    setInterval(() => {
      NotificationService.checkDeadlines();
    }, 24 * 60 * 60 * 1000);
  });
}

startServer();
