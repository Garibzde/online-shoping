import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

const main = async () => {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(`Bazada artıq ${existing} məhsul var, seed keçildi`);
    return;
  }

  const names = ["Elektronika", "Geyim", "Kitab"];

  const categories = await Promise.all(
    names.map((name) => {
      const slug = name.toLowerCase();
      return prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name, slug },
      });
    })
  );

  const products = Array.from({ length: 24 }, (_, index) => {
    const n = index + 1;
    return {
      name: `Test məhsul ${n}`,
      description: `Bu, ${n} nömrəli test məhsulunun təsviridir.`,
      price: 10 + n * 7.5,
      stock: n % 5 === 0 ? 0 : 10 + n,
      categoryId: categories[index % categories.length].id,
    };
  });

  await prisma.product.createMany({ data: products });
  console.log("24 test məhsulu əlavə olundu");
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());