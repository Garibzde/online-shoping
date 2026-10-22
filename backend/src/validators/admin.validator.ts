import { z } from "zod";

const orderStatusSchema = z.enum(
  ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
  { error: "Status düzgün deyil" }
);

const roleSchema = z.enum(["USER", "ADMIN"], { error: "Rol düzgün deyil" });

export const adminOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: orderStatusSchema.optional(),
  userId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().min(1).optional(),
  role: roleSchema.optional(),
});

export const updateUserRoleSchema = z.object({
  role: roleSchema,
});

export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;