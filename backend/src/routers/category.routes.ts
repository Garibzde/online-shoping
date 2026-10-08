import { Router } from "express";
import {
  getAll,
  getOne,
  create,
  update,
  remove,
} from "../controller/category.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { categorySchema } from "../validators/category.validator.js";

const router = Router();

// Hamı ucun
router.get("/", getAll);
router.get("/:id", getOne);

//admin ucun
router.post("/", authenticate, authorize("ADMIN"), validate(categorySchema), create);
router.put("/:id", authenticate, authorize("ADMIN"), validate(categorySchema), update);
router.delete("/:id", authenticate, authorize("ADMIN"), remove);

export default router;