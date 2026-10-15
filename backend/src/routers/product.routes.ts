import { Router } from "express"
import {
  getAll,
  getOne,
  create,
  update,
  remove,
} from "../controller/product.controller.js"
import { authenticate } from "../middleware/auth.js"
import { authorize } from "../middleware/authorize.js"
import { validate } from "../middleware/validate.js"
import {
  productSchema,
  updateProductSchema,
} from "../validators/product.validator.js"

const router = Router()


router.get("/", getAll)
router.get("/:id", getOne)


router.post("/", authenticate, authorize("ADMIN"), validate(productSchema), create)
router.patch("/:id", authenticate, authorize("ADMIN"), validate(updateProductSchema), update)
router.delete("/:id", authenticate, authorize("ADMIN"), remove)

export default router