import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/AppError.js";

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

  console.error(err);
  res.status(500).json({ message: "Daxili server xətası" });
};