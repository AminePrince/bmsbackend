import jwt from "jsonwebtoken";

const JWT_SECRET = "bms-rider-secret-key-2024";

export const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Token invalide" });
  }
};

export const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé: Admin uniquement" });
  }
  next();
};
