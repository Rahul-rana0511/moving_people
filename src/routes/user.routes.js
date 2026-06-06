import { Router } from "express";
import { createContactUs } from "../controllers/user.controller.js";
import { validations } from "../validations/validations.js";

const router = Router();

router.route("/contact-us").post(validations.validateContactUs, createContactUs);

export default router;
