import { Router } from "express";
import {
  getStats,
  listOrders,
  getOrder,
  updateOrderStatus,
  listUsers,
  updateUserRole,
} from "../controller/admin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  updateOrderStatusSchema,
  updateUserRoleSchema,
} from "../validators/admin.validator.js";

const router = Router();


router.use(authenticate, authorize("ADMIN"));

router.get("/stats", getStats);

router.get("/orders", listOrders);
router.get("/orders/:id", getOrder);
router.patch("/orders/:id/status", validate(updateOrderStatusSchema), updateOrderStatus);

router.get("/users", listUsers);
router.patch("/users/:id/role", validate(updateUserRoleSchema), updateUserRole);

export default router;