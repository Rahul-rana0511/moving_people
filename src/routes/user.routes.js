import { Router } from "express";
import { createContactUs, trackVisitor } from "../controllers/user.controller.js";
import { validations } from "../validations/validations.js";

const router = Router();

router.route("/contact-us").post(validations.validateContactUs, createContactUs);
router.route("/visitor").post(trackVisitor);

export default router;
