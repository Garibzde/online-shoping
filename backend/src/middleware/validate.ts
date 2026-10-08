import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { parseOrThrow } from "../utils/parse.js";

export const validate =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = parseOrThrow(schema, req.body); 
    next();
  };