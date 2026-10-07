import "dotenv/config"
import bcrypt from "bcryptjs"
import {prisma} from "../src/config/prisma"

const main = async()=>{
    const name = process.env.ADMIN_NAME ?? "Admin";
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
    throw new Error("ADMIN_EMAIL və ADMIN_PASSWORD .env faylında olmalıdır");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD ən azı 8 simvol olmalıdır");
  }
  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" }, 
    create: {
      name,
      email,
      password: hashed,
      role: "ADMIN",
      cart: { create: {} },
    },
    select: { id: true, email: true, role: true },
  });

  console.log("Admin hazırdır:", admin);
  

}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
