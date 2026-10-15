import type { Prisma } from "../generated/prisma/client.js"
import { prisma } from "../config/prisma.js"
import { AppError } from "../utils/AppError.js"
import type {
  ProductInput,
  UpdateProductInput,
  ProductQuery,
} from "../validators/product.validator.js"

const categorySelect = { select: { id: true, name: true, slug: true } } as const

const orderByMap :Record<ProductQuery["sort"],
  Prisma.ProductOrderByWithRelationInput> ={
    newest: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    name_asc: { name: "asc" },
  }

const assertCategoryExists = async (categoryId: number) =>{
    const category = await prisma.category.findUnique({
        where:{id:categoryId},
        select:{id:true},
    })
    if(!category){
        throw new AppError(400, "Secilen category mevcud deyl")
    }
}

export const listProducts = async (query: ProductQuery) => {
  const { page, limit, search, categoryId, minPrice, maxPrice, inStock, sort } =
    query

  const price =
    minPrice !== undefined || maxPrice !== undefined
      ? {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        }
      : undefined

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(price ? { price } : {}),
    ...(inStock === true ? { stock: { gt: 0 } } : {}),
    ...(inStock === false ? { stock: 0 } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { category: categorySelect },
      orderBy: [orderByMap[sort], { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getProduct = async (id:number) =>{
    const product = await prisma.product.findUnique({
        where:{id},
        include:{category:categorySelect}
    })
    if(!product){
        throw new AppError(404, "Mehsul tapilmadi")
    }
    return product
}

export const createProduct = async(data:ProductInput) =>{
    await assertCategoryExists(data.categoryId)

    return prisma.product.create({
        data:{
            name:data.name,
            description: data.description,
            price: data.price,
            stock: data.stock ?? 0,
            imageUrl: data.imageUrl ?? null,
            categoryId: data.categoryId,
        },
        include:{category:categorySelect}
    })
}

export const updateProduct = async (id: number, data: UpdateProductInput) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new AppError(404, "Məhsul tapılmadı")
  }

  if (data.categoryId !== undefined) {
    await assertCategoryExists(data.categoryId)
  }

  return prisma.product.update({
    where: { id },
    data,
    include: { category: categorySelect },
  })
}

export const deleteProduct = async (id: number) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    throw new AppError(404, "Məhsul tapılmadı")
  }

  const orderCount = await prisma.orderItem.count({ where: { productId: id } })
  if (orderCount > 0) {
    throw new AppError(
      409,
      "Bu məhsul sifarişlərdə istifadə olunub, silmək olmaz. Stoku 0 edə bilərsiniz"
    )
  }

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ])
}