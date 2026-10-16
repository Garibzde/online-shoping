import type { Request, Response } from "express";
import * as cartService from "../services/cart.service.js";
import { parseOrThrow } from "../utils/parse.js";
import { productIdParamSchema } from "../validators/cart.validator.js";

export const getCart = async(req:Request, res:Response)=>{
    const cart = await cartService.getCart(req.user!.id)
    res.json({cart})
} 

export const addItem = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addItem(req.user!.id, productId, quantity);
  res.json({ cart });
};

export const updateItem = async (req: Request, res: Response) => {
  const { productId } = parseOrThrow(productIdParamSchema, req.params);
  const cart = await cartService.updateItem(
    req.user!.id,
    productId,
    req.body.quantity
  );
  res.json({ cart });
};

export const removeItem = async (req: Request, res: Response) => {
  const { productId } = parseOrThrow(productIdParamSchema, req.params);
  const cart = await cartService.removeItem(req.user!.id, productId);
  res.json({ cart });
};

export const clearCart = async (req: Request, res: Response) => {
  const cart = await cartService.clearCart(req.user!.id);
  res.json({ cart });
};
