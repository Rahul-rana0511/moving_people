import { Router } from "express";
const router = Router();
import authentication from "../middlewares/admin.authentication.js";
import {
  createSuperAdmin,
  createAdmin,
  createEmployee,
  getEmployeeList,
  adminLogin,
  changePassword,
  editProfile,
  forgotpassword,
  assignContactToEmployee,
  addContactNote,
  getContactNotes,
  getContactHistory,
  resetPassword,
  verifyOTP,
  resendOTP,
  getProfile,
  getContactUsList,
  getContactUsDetail,
  getTopContactUsCountries,
  getContactUsDashboard,
  updateContactUsStatus,
  deleteContactUs,
  getEnquiryTypeChart,
  getLastSixMonthsEnquiriesChart,
  getVisitorCountryStats
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
router.route("/createEmployee").post(createEmployee);
router.route("/employees").get(getEmployeeList);
router.route("/contact-us").get(getContactUsList);
router.route("/contact-us/top-countries").get(getTopContactUsCountries);
router.route("/contact-us/:id").get(getContactUsDetail);
router.route("/contact-us/:id/assign").patch(assignContactToEmployee);
router.route("/contact-us/:id/history").get(getContactHistory);
router.route("/contact-us/:id/notes").get(getContactNotes);
router.route("/contact-us/notes").post(addContactNote);
router.route("/getProfile").get(getProfile);
router.route("/editProfile").put(uploadMiddleware, editProfile);
router.route("/changePassword").patch(changePassword);
router.route("/contact-us/:id/status").patch(updateContactUsStatus);
router.route("/contact-us/:id").delete(deleteContactUs);
router.route("/dashboard").get(getContactUsDashboard);
router.route("/enquiry-type-chart").get(getEnquiryTypeChart);
router.route("/last-six-months-chart").get(getLastSixMonthsEnquiriesChart);
router.route("/visitors/country-stats").get(getVisitorCountryStats);
export default router;
