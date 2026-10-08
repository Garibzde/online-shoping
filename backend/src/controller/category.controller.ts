import type { Request, Response } from "express";
import * as categoryService from "../services/category.service.js";
import { parseOrThrow } from "../utils/parse.js";
import { idParamSchema } from "../validators/common.validator.js";



export const getAll = async (_req: Request, res: Response) => {
  const categories = await categoryService.listCategories();
  res.json({ categories });
};

export const getOne = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const category = await categoryService.getCategory(id);
  res.json({ category });
};

export const create = async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body.name);
  res.status(201).json({ category });
};

export const update = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const category = await categoryService.updateCategory(id, req.body.name);
  res.json({ category });
};

export const remove = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  await categoryService.deleteCategory(id);
  res.status(204).send();
};