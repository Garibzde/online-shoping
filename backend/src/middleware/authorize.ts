import type { Request, Response, NextFunction } from "express";
import type { Role } from "../generated/prisma/enums.js";
import { AppError } from "../utils/AppError.js";

export const authorize = (...allowedRoles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "İcazə tələb olunur");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, "Bu əməliyyat üçün icazəniz yoxdur");
    }

    next();
  };