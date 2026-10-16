import { error } from "node:console";
import {z} from "zod";

const quantitySchema = z
.number({error:"Miqdar eded olmalidir"})
.int({error:"Miqdar tam eded olmalidir"})
.min(1,{error:"Miqdar en az 1 olmalidir"})
.max(99,{error:"Miqdar en cox 99 ola biler"})

export const addToCartSchema = z.object({
    productId: z
    .number({ error: "Məhsul seçilməlidir" })
    .int()
    .positive({ error: "Məhsul düzgün deyil" }),
    quantity: quantitySchema.default(1),
})

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export const productIdParamSchema = z.object({
  productId: z.coerce.number().int().positive({ error: "Məhsul ID-si düzgün deyil" }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;