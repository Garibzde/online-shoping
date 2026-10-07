import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js"
import type { RegisterInput } from "../validators/auth.validator.js";
import type { Role } from "../generated/prisma/enums.js";


const SALT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS)

const publicUserSelect = {
    id:true,
    name:true,
    email:true,
    role:true,
    createdAt:true,

} as const;

const signToken = (id: number, role: Role) => {
  return jwt.sign(
    { id, role },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    }
  );
};

export const registerUser = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError(409, "Bu email artıq qeydiyyatdan keçib");
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashed = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      cart: { create: {} }, 
    },
    select: publicUserSelect,
  });

  return { user, token: signToken(user.id, user.role) };
};
export const loginUser = async (email: string, password: string) => {
  const found = await prisma.user.findUnique({ where: { email } });

  const hashToCompare = found?.password ?? DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(password, hashToCompare);

  if (!found || !passwordMatches) {
    throw new AppError(401, "Email və ya şifrə yanlışdır");
  }

  const { password: _password, ...user } = found;
  return { user, token: signToken(found.id, found.role) };
};


export const getCurrentUser = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!user) {
    throw new AppError(404, "İstifadəçi tapılmadı");
  }
  return user;
};