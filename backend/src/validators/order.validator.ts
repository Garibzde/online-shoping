import { z } from "zod";

export const checkoutSchema = z.object({
  shippingAddress: z
    .string()
    .trim()
    .min(5, { error: "Ünvan ən azı 5 simvol olmalıdır" })
    .max(200, { error: "Ünvan ən çox 200 simvol ola bilər" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, { error: "Telefon nömrəsi düzgün deyil" }),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;