import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Ad ən azı 2 simvol olmalıdır" })
    .max(50, { error: "Ad ən çox 50 simvol ola bilər" }),
});

export type CategoryInput = z.infer<typeof categorySchema>;