import {object, z} from "zod";
import { describe } from "zod/v4/core";

const hasMaxTwoDecimals = (value: number) =>
    Math.abs(value*100-Math.round(value*100)) < 1e-8

export const productSchema = z.object({
    name:z.string()
    .trim()
    .min(2, {error:"ad en az 2 sinvol olmalidir"})
    .max(48, {error:"ad en cox 48 simvol olmaldir"}),

    description:z.string()
    .trim()
    .min(10, {error:"ad en az 10 sinvol olmalidir"})
    .max(2000, {error:"ad en cox 2000 simvol olmaldir"}),

    price:z.number({error:'Qiymet eded olmalidir'})
    .positive({error:"Qiymet 0 dan boyuk olmalidir"})
    .max(1_000_000, {error:"Qiymet cox boyuk ededir"})
    .refine(hasMaxTwoDecimals, {error:"Qiymet en cox 2 onluq reqem olmalidir"}),

    stock:z.number({ error: "Stok ədəd olmalıdır" })
    .int({ error: "Stok tam ədəd olmalıdır" })
    .min(0, { error: "Stok mənfi ola bilməz" })
    .optional(),

    imageUrl: z.url({ error: "Şəkil ünvanı düzgün deyil" }).nullable().optional(),

    categoryId: z
    .number({ error: "Kateqoriya seçilməlidir" })
    .int()
    .positive({ error: "Kateqoriya düzgün deyil" }),

})
export const updateProductSchema = productSchema.partial().refine((data)=>Object.keys(data).length > 0, {
    error:"En az bir sahe gonderilmelidir"
})

export const productQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    search: z.string().trim().min(1).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    sort: z
      .enum(["newest", "oldest", "price_asc", "price_desc", "name_asc"])
      .default("newest"),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { error: "minPrice maxPrice-dan böyük ola bilməz", path: ["minPrice"] }
  )

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
