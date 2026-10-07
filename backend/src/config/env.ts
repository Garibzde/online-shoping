import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET .env faylında tapılmadı");
}


export const env = {
  port: Number(process.env.PORT) || 5000,
  isProd: process.env.NODE_ENV === "production",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 7,
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
};