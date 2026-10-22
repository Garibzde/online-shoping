import type { Prisma } from "../generated/prisma/client.js";
import type { Role } from "../generated/prisma/enums.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { AdminUserQuery } from "../validators/admin.validator.js";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

type AdminUser = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>;

const toDto = ({ _count, ...user }: AdminUser) => ({
  ...user,
  orderCount: _count.orders,
});

export const listUsers = async (query: AdminUserQuery) => {
  const { page, limit, search, role } = query;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map(toDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const changeUserRole = async (
  actingAdminId: number,
  targetId: number,
  role: Role
) => {
  if (actingAdminId === targetId) {
    throw new AppError(400, "Öz rolunuzu dəyişə bilməzsiniz");
  }

  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true },
    });
    if (!existing) {
      throw new AppError(404, "İstifadəçi tapılmadı");
    }
    if (existing.role === role) {
      throw new AppError(409, "İstifadəçi artıq bu roldadır");
    }


    await tx.refreshToken.deleteMany({ where: { userId: targetId } });

    return tx.user.update({
      where: { id: targetId },
      data: { role },
      select: adminUserSelect,
    });
  });

  return toDto(user);
};