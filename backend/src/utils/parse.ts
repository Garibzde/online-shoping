import type { ZodType, z } from "zod";
import { AppError } from "./AppError.js";

export const parseOrThrow = <T extends ZodType>(
  schema: T,
  data: unknown
): z.infer<T> => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    throw new AppError(400, "Validasiya xətası", details);
  }

  return result.data;
};  