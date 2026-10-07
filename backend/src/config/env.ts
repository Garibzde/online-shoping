import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET .env faylında tapılmadı");
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
};