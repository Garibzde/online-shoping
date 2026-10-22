import type { Request, Response } from "express";
import * as adminOrderService from "../services/adminOrder.service.js";
import * as adminUserService from "../services/adminUser.service.js";
import * as statsService from "../services/stats.service.js";
import { parseOrThrow } from "../utils/parse.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  adminOrderQuerySchema,
  adminUserQuerySchema,
} from "../validators/admin.validator.js";

export const getStats = async (_req: Request, res: Response) => {
  const stats = await statsService.getDashboardStats();
  res.json({ stats });
};

export const listOrders = async (req: Request, res: Response) => {
  const query = parseOrThrow(adminOrderQuerySchema, req.query);
  res.json(await adminOrderService.listAllOrders(query));
};

export const getOrder = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const order = await adminOrderService.getAnyOrder(id);
  res.json({ order });
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const order = await adminOrderService.changeOrderStatus(id, req.body.status);
  res.json({ order });
};

export const listUsers = async (req: Request, res: Response) => {
  const query = parseOrThrow(adminUserQuerySchema, req.query);
  res.json(await adminUserService.listUsers(query));
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const user = await adminUserService.changeUserRole(
    req.user!.id,
    id,
    req.body.role
  );
  res.json({ user });
};