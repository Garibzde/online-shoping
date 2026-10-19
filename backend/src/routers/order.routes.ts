import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  cancel,
} from "../controller/order.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema } from "../validators/order.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(checkoutSchema), create);
router.get("/", getAll);
router.get("/:id", getOne);
router.post("/:id/cancel", cancel);

export default router;