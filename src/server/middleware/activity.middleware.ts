import { db } from "../db/mockDb.js";

export const logActivity = (action: string, module: string, description: string) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    if (user) {
      const newLog = {
        id: db.activityLogs.length > 0 ? Math.max(...db.activityLogs.map(l => l.id)) + 1 : 1,
        userId: user.id,
        action,
        module,
        description,
        ipAddress: req.ip || "unknown",
        createdAt: new Date().toISOString()
      };
      db.activityLogs.push(newLog);
    }
    next();
  };
};

// Helper for manual logging
export const createActivityLog = (userId: number, action: string, module: string, description: string, ip: string = "system") => {
  const newLog = {
    id: db.activityLogs.length > 0 ? Math.max(...db.activityLogs.map(l => l.id)) + 1 : 1,
    userId,
    action,
    module,
    description,
    ipAddress: ip,
    createdAt: new Date().toISOString()
  };
  db.activityLogs.push(newLog);
};
