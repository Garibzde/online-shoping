import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Token tələb olunur");
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & {
      id: number;
      role: "USER" | "ADMIN";
    };
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    throw new AppError(401, "Token etibarsızdır və ya vaxtı bitib");
  }
};