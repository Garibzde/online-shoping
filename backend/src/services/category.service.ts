import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/slugify.js";

const withCount = { _count: { select: { products: true } } } as const;

const toDto = <T extends { _count: { products: number } }>({
  _count,
  ...rest
}: T) => ({ ...rest, productCount: _count.products });

const buildSlug = (name: string) => {
  const slug = slugify(name);
  if (!slug) {
    throw new AppError(400, "Ad düzgün deyil, ən azı bir hərf və ya rəqəm olmalıdır");
  }
  return slug;
};

const assertUnique = async (name: string, slug: string, excludeId?: number) => {
  const conflict = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }],
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
  if (conflict) {
    throw new AppError(409, "Bu adla kateqoriya artıq mövcuddur");
  }
};

export const listCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: withCount,
  });
  return categories.map(toDto);
};

export const getCategory = async (id: number) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: withCount,
  });
  if (!category) {
    throw new AppError(404, "Kateqoriya tapılmadı");
  }
  return toDto(category);
};

export const createCategory = async (name: string) => {
  const slug = buildSlug(name);
  await assertUnique(name, slug);

  const category = await prisma.category.create({
    data: { name, slug },
    include: withCount,
  });
  return toDto(category);
};

export const updateCategory = async (id: number, name: string) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, "Kateqoriya tapılmadı");
  }

  const slug = buildSlug(name);
  await assertUnique(name, slug, id);

  const category = await prisma.category.update({
    where: { id },
    data: { name, slug },
    include: withCount,
  });
  return toDto(category);
};

export const deleteCategory = async (id: number) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: withCount,
  });
  if (!category) {
    throw new AppError(404, "Kateqoriya tapılmadı");
  }

  if (category._count.products > 0) {
    throw new AppError(
      409,
      "Bu kateqoriyada məhsullar var, əvvəlcə onları silin və ya başqa kateqoriyaya köçürün"
    );
  }

  await prisma.category.delete({ where: { id } });
};