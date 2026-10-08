import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRouter from "./routers/auth.routes.js";
import adminRouter from "./routers/admin.routes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import categoryRouter from "./routers/category.routes.js"

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/categories",categoryRouter)

app.use(notFound);
app.use(errorHandler);

export default app;