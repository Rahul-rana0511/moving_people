import { Router } from "express";
const router = Router();
import authentication from "../middlewares/admin.authentication.js";
import {
  createSuperAdmin,
  createAdmin,
  adminLogin,
  changePassword,
  editProfile,
  forgotpassword,
  resetPassword,
  verifyOTP,
  resendOTP,
  getProfile
} from "../controllers/admin.controller.js";
import { uploadMiddleware } from "../middlewares/multer.js";
router.route("/register").get(createSuperAdmin);
router.route("/login").post(adminLogin);
router.route("/createAdmin").post(createAdmin);
router.route("/forgetpassword").post(forgotpassword);
router.route("/resetpassword").post(resetPassword);
router.route("/resendOtp").post(resendOTP);
router.route("/verifyotp").post(verifyOTP);

router.use(authentication);
router.route("/getProfile").get(getProfile);
router.route("/editProfile").put(uploadMiddleware, editProfile);
router.route("/changePassword").patch(changePassword);

export default router;
