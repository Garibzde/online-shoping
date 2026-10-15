import type { Request, Response } from "express"
import * as productService from "../services/product.service.js"
import { parseOrThrow } from "../utils/parse.js"
import { idParamSchema } from "../validators/common.validator.js"
import { productQuerySchema } from "../validators/product.validator.js"

export const getAll = async (req: Request, res: Response) => {
  const query = parseOrThrow(productQuerySchema, req.query)
  const result = await productService.listProducts(query)
  res.json(result)
}

export const getOne = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params)
  const product = await productService.getProduct(id)
  res.json({ product })
}

export const create = async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body)
  res.status(201).json({ product })
}

export const update = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params)
  const product = await productService.updateProduct(id, req.body)
  res.json({ product })
}

export const remove = async (req: Request, res: Response) => {
  const { id } = parseOrThrow(idParamSchema, req.params)
  await productService.deleteProduct(id)
  res.status(204).send()
}