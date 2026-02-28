import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { authRoutes } from "./src/server/routes/auth.routes";
import { carRoutes } from "./src/server/routes/car.routes";
import { clientRoutes } from "./src/server/routes/client.routes";
import { rentalRoutes } from "./src/server/routes/rental.routes";
import { dashboardRoutes } from "./src/server/routes/dashboard.routes";
import { paymentRoutes } from "./src/server/routes/payment.routes";
import { invoiceRoutes } from "./src/server/routes/invoice.routes";
import { documentRoutes } from "./src/server/routes/document.routes";
import { activityRoutes } from "./src/server/routes/activity.routes";
import { incidentRoutes } from "./src/server/routes/incident.routes";
import { maintenanceRoutes } from "./src/server/routes/maintenance.routes";
import { notificationRoutes } from "./src/server/routes/notification.routes";
import { assistanceRoutes } from "./src/server/routes/assistance.routes";
import { analyticsRoutes } from "./src/server/routes/analytics.routes";
import { insuranceRoutes } from "./src/server/routes/insurance.routes";
import { calendarRoutes } from "./src/server/routes/calendar.routes";
import { NotificationService } from "./src/server/services/notification.service.js";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // DEV ONLY
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);

    NotificationService.checkDeadlines();
    setInterval(NotificationService.checkDeadlines, 86400000);
  });
}

startServer();
