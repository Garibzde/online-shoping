import {Router} from "express"
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from "../controller/cart.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";

const router = Router();

router.use(authenticate)

router.get("/", getCart);
router.delete("/", clearCart);
router.post("/items", validate(addToCartSchema), addItem);
router.patch("/items/:productId", validate(updateCartItemSchema), updateItem);
router.delete("/items/:productId", removeItem);

export default router;