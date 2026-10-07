import type { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import {env} from "../config/env.js";

const REFRESH_COOKIE = "refreshToken";

const cookieOptions ={
    httpOnly:true,
    secure:env.isProd,
    sameSite:"lax" as const,
    path:"/api/auth"
}

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieOptions,
    maxAge: env.refreshTokenDays * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body
  );
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
};
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(
    email,
    password
  );
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
};


export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new AppError(401, "Refresh token tapılmadı");
  }

  const { accessToken, refreshToken } = await authService.refreshSession(token);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
};

export const logout = async (req: Request, res: Response) => {
  await authService.logoutUser(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).send();
};

export const me = async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json({ user });
};