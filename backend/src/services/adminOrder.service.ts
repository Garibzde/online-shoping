import type { Prisma } from "../generated/prisma/client.js";
import type { OrderStatus } from "../generated/prisma/enums.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { orderInclude, toDto as toOrderDto } from "./order.service.js";
import type { AdminOrderQuery } from "../validators/admin.validator.js";

const adminOrderInclude = {
  ...orderInclude,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

type AdminOrder = Prisma.OrderGetPayload<{ include: typeof adminOrderInclude }>;

const toAdminDto = (order: AdminOrder) => ({
  ...toOrderDto(order),
  user: order.user,
});

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const listAllOrders = async (query: AdminOrderQuery) => {
  const { page, limit, status, userId, search } = query;

  const searchFilters: Prisma.OrderWhereInput[] = search
    ? [
        ...(/^\d{1,9}$/.test(search) ? [{ id: Number(search) }] : []),
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]
    : [];

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(userId ? { userId } : {}),
    ...(searchFilters.length > 0 ? { OR: searchFilters } : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: adminOrderInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: orders.map(toAdminDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getAnyOrder = async (id: number) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: adminOrderInclude,
  });
  if (!order) {
    throw new AppError(404, "Sifariş tapılmadı");
  }
  return toAdminDto(order);
};

export const changeOrderStatus = async (id: number, status: OrderStatus) => {
  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      throw new AppError(404, "Sifariş tapılmadı");
    }

    if (existing.status === status) {
      throw new AppError(409, "Sifariş artıq bu statusdadır");
    }

    if (!allowedTransitions[existing.status].includes(status)) {
      throw new AppError(
        409,
        `${existing.status} statusundan ${status} statusuna keçid mümkün deyil`
      );
    }

    const { count } = await tx.order.updateMany({
      where: { id, status: existing.status },
      data: { status },
    });
    if (count === 0) {
      throw new AppError(409, "Sifarişin statusu dəyişib, yenidən cəhd edin");
    }


    if (status === "CANCELLED") {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.findUniqueOrThrow({
      where: { id },
      include: adminOrderInclude,
    });
  });

  return toAdminDto(order);
};