import adminServices from "../services/admin.services.js";

const createSuperAdmin = async (req, res) => {
  await adminServices.createSuperAdmin(req, res);
};

const createAdmin = async (req, res) => {
  await adminServices.createAdmin(req, res);
};

const adminLogin = async (req, res) => {
  await adminServices.adminLogin(req, res);
};

const changePassword = async (req, res) => {
  await adminServices.changePassword(req, res);
};

const forgotpassword = async (req, res) => {
  await adminServices.forgotpassword(req, res);
};

const resetPassword = async (req, res) => {
  await adminServices.resetPassword(req, res);
};

const resendOTP = async (req, res) => {
  await adminServices.resendOTP(req, res);
};

const verifyOTP = async (req, res) => {
  await adminServices.verifyOTP(req, res);
};

const getContactUsList = async (req, res) => {
  await adminServices.getContactUsList(req, res);
};

const getContactUsDetail = async (req, res) => {
  await adminServices.getContactUsDetail(req, res);
};

const getProfile = async (req, res) => {
  await adminServices.getProfile(req, res);
};

const editProfile = async (req, res) => {
  await adminServices.editProfile(req, res);
};

export {
  createSuperAdmin,
  createAdmin,
  adminLogin,
  changePassword,
  forgotpassword,
  getContactUsList,
  getContactUsDetail,
  getProfile,
  editProfile,
  resetPassword,
  verifyOTP,
  resendOTP,
};
