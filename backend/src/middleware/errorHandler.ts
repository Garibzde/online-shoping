import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";

const getPrismaCode = (err: unknown): string | undefined =>
  typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: unknown }).code)
    : undefined;

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Yol tapılmadı: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  const prismaCode = getPrismaCode(err);

  if (prismaCode === "P2002") {
    res.status(409).json({ message: "Bu məlumat artıq mövcuddur" });
    return;
  }

  if (prismaCode === "P2025") {
    res.status(404).json({ message: "Qeyd tapılmadı" });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Daxili server xətası" });
};