import { z} from "zod"

export const registerSchema = z.object({
    name: z.string().trim().min(2, {error:"ad en az 2 simvol olmalir"}),
    email: z.string().trim().toLowerCase().pipe(z.email({error:"email duzgun deyil"})),
    password: z.string().min(8, {error:"sifre en az 8 sinvol olmalidir"})
})

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email({error:"email duzgun daxil edilmeyib"})),
    password:z.string().min(1,"Sifre teleb olunur")
})

export type RegisterInput = z.infer<typeof registerSchema> 
export type LoginInput = z.infer<typeof loginSchema>