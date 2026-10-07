import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  res.json(result);
};

export const me = async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ user });
};