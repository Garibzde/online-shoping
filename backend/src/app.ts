import express from "express";
import cors from "cors";
import authRouter from "./routers/auth.routers.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use(notFound);
app.use(errorHandler);

export default app;