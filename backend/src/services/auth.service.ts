import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { Role } from "../generated/prisma/enums.js";
import type { RegisterInput } from "../validators/auth.validator.js";

const SALT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

const signAccessToken = (id: number, role: Role) =>
  jwt.sign({ id, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
const generateRefreshToken = (userId: number) => {
  const token = crypto.randomBytes(48).toString("hex");
  const record = {
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(
      Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000
    ),
  };
  return { token, record };
};

const issueTokens = async (user: { id: number; role: Role }) => {
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const { token, record } = generateRefreshToken(user.id);
  await prisma.refreshToken.create({ data: record });

  return {
    accessToken: signAccessToken(user.id, user.role),
    refreshToken: token,
  };
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

  const tokens = await issueTokens(user);
  return { user, ...tokens };
};

export const loginUser = async (email: string, password: string) => {
  const found = await prisma.user.findUnique({ where: { email } });

  const hashToCompare = found?.password ?? DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(password, hashToCompare);

  if (!found || !passwordMatches) {
    throw new AppError(401, "Email və ya şifrə yanlışdır");
  }

  const { password: _password, ...user } = found;
  const tokens = await issueTokens(found);
  return { user, ...tokens };
};

export const refreshSession = async (oldToken: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(oldToken) },
    include: { user: true },
  });

  if (!stored) {
    throw new AppError(401, "Refresh token etibarsızdır");
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.deleteMany({ where: { id: stored.id } });
    throw new AppError(401, "Sessiyanın vaxtı bitib, yenidən daxil olun");
  }

 
  const { token: newToken, record } = generateRefreshToken(stored.userId);

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.refreshToken.deleteMany({
      where: { id: stored.id },
    });
    
    if (count === 0) {
      throw new AppError(401, "Refresh token etibarsızdır");
    }
    await tx.refreshToken.create({ data: record });
  });

  return {
    accessToken: signAccessToken(stored.userId, stored.user.role),
    refreshToken: newToken,
  };
};

export const logoutUser = async (token?: string) => {
  if (!token) return;
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
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