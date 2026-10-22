import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { formatCents, toCents } from "../utils/money.js";
import type {
  CheckoutInput,
  OrderQuery,
} from "../validators/order.validator.js";
import { count } from "node:console";

export const orderInclude = {
  items: {
    orderBy: { id: "asc" },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const toDto = (order: OrderWithItems) => ({
  id: order.id,
  status: order.status,
  total: order.total.toFixed(2),
  shippingAddress: order.shippingAddress,
  phone: order.phone,
  createdAt: order.createdAt,
  items: order.items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    imageUrl: item.product.imageUrl,
    price: item.price.toFixed(2), 
    quantity: item.quantity,
    lineTotal: formatCents(toCents(item.price) * item.quantity),
  })),
});

export const createOrder = async(userId:number, input: CheckoutInput) =>{
    const order = await prisma.$transaction(async (tx)=>{
        const cartItems = await tx.cartItem.findMany({
            where:{cart:{userId}},
            include:{product:true},
            orderBy:{productId:"asc"}
        })
        if(cartItems.length === 0){
            throw new AppError(400, "sebet bosdur")
        }

        let totalCents = 0
        for(const item of cartItems){
            const {count} = await tx.product.updateMany({
                where:{id:item.productId, stock:{gte:item.quantity}},
                data:{stock:{decrement: item.quantity}}

            })
            if(count === 0){
                throw new AppError(409,`"${item.product.name}" üçün stok kifayət etmir`);
            }
            totalCents+= toCents(item.product.price) * item.quantity
        }
    const created = await tx.order.create({
      data: {
        userId,
        total: formatCents(totalCents),
        shippingAddress: input.shippingAddress,
        phone: input.phone,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.cartItem.deleteMany({where:{cart:{userId}}})
    return created
    })
    return toDto(order)
}

export const listOrders = async (userId:number, query:OrderQuery) =>{
    const {page, limit, status} = query
    const where: Prisma.OrderWhereInput = {
    userId,
    ...(status ? { status } : {}),
  }

   const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
   return {
    items: orders.map(toDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export const getOrder = async(userId:number, id:number) =>{
    const order = await prisma.order.findFirst({
    where: { id, userId },
    include: orderInclude,
  });
  if(!order){
    throw new AppError(404, "Sifariş tapılmadı");
  }
  return toDto(order);
}

export const cancelOrder = async(userId:number, id:number) =>{
    const order = await prisma.$transaction(async(tx)=>{
        const existing = await tx.order.findFirst({
            where:{id, userId},
            include:{items:true}
        })
        if(!existing){
            throw new AppError(404, "Sifariş tapılmadı");
        }
        if (existing.status !== "PENDING") {
            throw new AppError(409, "Yalnız gözləmədə olan sifarişi ləğv etmək olar");
        }

        const {count} = await tx.order.updateMany({
            where:{id, status:"PENDING"},
            data:{status:"CANCELLED"}
        })

        if (count === 0) {
            throw new AppError(409, "Yalnız gözləmədə olan sifarişi ləğv etmək olar");
        }

        for (const item of existing.items) {
        await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
        });
    }
    return tx.order.findUniqueOrThrow({
      where: { id },
      include: orderInclude,
    });
})
  return toDto(order);
}