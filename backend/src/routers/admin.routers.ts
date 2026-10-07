import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/ping", (req, res) => {
  res.json({ message: "Admin panelinə xoş gəldin", adminId: req.user!.id });
});

export default router;