import type { OrderStatus } from "../generated/prisma/enums.js";
import { prisma } from "../config/prisma.js";

const REVENUE_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];
const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
const LOW_STOCK_THRESHOLD = 5;

export const getDashboardStats = async () => {
  const [
    userCount,
    productCount,
    lowStockCount,
    lowStockItems,
    statusGroups,
    revenue,
    topSold,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } }),
    prisma.product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, name: true, stock: true },
      orderBy: [{ stock: "asc" }, { id: "asc" }],
      take: 5,
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES } },
      _sum: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { in: REVENUE_STATUSES } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);


  const byStatus = Object.fromEntries(
    ALL_STATUSES.map((status) => [status, 0])
  ) as Record<OrderStatus, number>;
  for (const group of statusGroups) {
    byStatus[group.status] = group._count._all;
  }
  const orderTotal = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

  const topProducts = await prisma.product.findMany({
    where: { id: { in: topSold.map((row) => row.productId) } },
    select: { id: true, name: true, imageUrl: true },
  });
  const productById = new Map(topProducts.map((p) => [p.id, p]));

  return {
    users: { total: userCount },
    products: {
      total: productCount,
      lowStock: {
        threshold: LOW_STOCK_THRESHOLD,
        count: lowStockCount,
        items: lowStockItems,
      },
    },
    orders: { total: orderTotal, byStatus },
    revenue: { total: revenue._sum.total?.toFixed(2) ?? "0.00" },
    topProducts: topSold.map((row) => ({
      productId: row.productId,
      name: productById.get(row.productId)?.name ?? "Silinmiş məhsul",
      imageUrl: productById.get(row.productId)?.imageUrl ?? null,
      sold: row._sum.quantity ?? 0,
    })),
    recentOrders: recentOrders.map((order) => ({
      ...order,
      total: order.total.toFixed(2),
    })),
  };
};