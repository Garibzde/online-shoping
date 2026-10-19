import type { Request, Response } from "express";
import * as orderService from "../services/order.service.js";
import { parseOrThrow } from "../utils/parse.js";
import { idParamSchema } from "../validators/common.validator.js";
import { orderQuerySchema } from "../validators/order.validator.js";

export const create = async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.user!.id, req.body);
  res.status(201).json({ order });
};

export const getAll = async (req: Request, res: Response) => {
   const query = parseOrThrow(orderQuerySchema, req.query) 
    const result = await orderService.listOrders(req.user!.id, query);
    res.json(result);
}

export const getOne = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const order = await orderService.getOrder(req.user!.id, id);
  res.json({ order });
};

export const cancel = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const order = await orderService.cancelOrder(req.user!.id, id);
  res.json({ order });
};